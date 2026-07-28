import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import sharp from "sharp"
import QRCode from "qrcode"
import {
  buildProceduralTemplate,
  wrapNameText,
  safeNum,
  type AdditionalPlaceholder,
} from "@/lib/certificate-generator"
import { rasterizeSvg } from "@/lib/fonts/embed"

interface Props { params: Promise<{ certId: string }> }

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}

async function makeQR(url: string, size: number): Promise<Buffer> {
  const raw = await QRCode.toBuffer(url, {
    type: "png", width: size, margin: 1,
    color: { dark: "#000000", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  })
  return sharp(raw).resize(size, size).png().toBuffer()
}

export async function GET(_req: Request, { params }: Props) {
  const { certId } = await params

  const cert = await prisma.certificate.findUnique({
    where: { certId },
    include: {
      event: {
        include: {
          organizer: { select: { orgName: true } },
          template: true,
        },
      },
    },
  })
  if (!cert) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Serve pre-generated image from R2 if available
  if (cert.imageUrl) {
    return NextResponse.redirect(cert.imageUrl, { status: 302 })
  }

  const tpl = cert.event.template
  const fmt = (d: Date | null) =>
    d ? new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "long", year: "numeric" }).format(d) : "—"

  // ── Template buffer ───────────────────────────────────────────────────────
  let templatePng: Buffer

  if (tpl?.imageUrl) {
    const url = tpl.imageUrl.startsWith("/")
      ? `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}${tpl.imageUrl}`
      : tpl.imageUrl
    const res = await fetch(url)
    if (!res.ok) {
      templatePng = buildProceduralTemplate({
        eventName: cert.event.eventName,
        organizerName: cert.event.organizer.orgName,
        primaryColor: tpl?.primaryColor ?? "#1D4ED8",
      })
    } else {
      templatePng = await sharp(Buffer.from(await res.arrayBuffer())).png().toBuffer()
    }
  } else {
    templatePng = buildProceduralTemplate({
      eventName: cert.event.eventName,
      organizerName: cert.event.organizer.orgName,
      primaryColor: tpl?.primaryColor ?? "#1D4ED8",
    })
  }

  // ── Layout ────────────────────────────────────────────────────────────────
  const nameCenterX  = tpl?.nameCenterX  ?? 600
  const nameY        = tpl?.nameY        ?? 340
  const nameMaxWidth = tpl?.nameMaxWidth ?? 840
  const nameFontSize = tpl?.nameFontSize ?? 52
  const nameFont     = tpl?.nameFont     ?? "Arial, Helvetica, sans-serif"
  const nameColor    = tpl?.nameColor    ?? "#1E293B"
  const qrX          = tpl?.qrX         ?? 1010
  const qrY          = tpl?.qrY         ?? 628
  const qrSize       = tpl?.qrSize       ?? 140
  const certIdFont   = tpl?.certIdFont   ?? "monospace"
  const certIdColor  = tpl?.certIdColor  ?? "#64748B"

  const meta = await sharp(templatePng).metadata()
  const W = meta.width ?? 1200
  const H = meta.height ?? 840

  // ── Name SVG ──────────────────────────────────────────────────────────────
  // Wraps onto multiple lines (rather than only shrinking on one) for names too long to
  // fit legibly on a single line — see lib/certificate-generator.ts#wrapNameText.
  const { fontSize, lines: nameLines } = wrapNameText(cert.participantName, nameFontSize, nameMaxWidth)
  const nameLineHeight = fontSize * 1.15
  const nameFirstLineY = nameY - ((nameLines.length - 1) * nameLineHeight) / 2
  const nameTspans = nameLines
    .map((line, i) => `<tspan x="${nameCenterX}" y="${nameFirstLineY + i * nameLineHeight}">${escapeXml(line)}</tspan>`)
    .join("")
  const nameSvg = rasterizeSvg(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <text text-anchor="middle" dominant-baseline="middle"
        font-family="${escapeXml(nameFont)}" font-size="${fontSize}px"
        font-weight="bold" fill="${escapeXml(nameColor)}">${nameTspans}</text>
</svg>`)

  // ── Cert ID SVG ───────────────────────────────────────────────────────────
  const certIdX = qrX + qrSize / 2
  const certIdY = qrY + qrSize + 18
  const certIdSvg = rasterizeSvg(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <text x="${certIdX}" y="${certIdY}" text-anchor="middle"
        font-family="${escapeXml(certIdFont)}" font-size="11px"
        fill="${escapeXml(certIdColor)}" letter-spacing="1">CERT ID: ${escapeXml(cert.certId)}</text>
</svg>`)

  // ── QR ────────────────────────────────────────────────────────────────────
  const qrUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/certs/view/${cert.certId}`
  const qrBuffer = await makeQR(qrUrl, Math.round(qrSize))

  // ── Skills + dates SVG (procedural template only) ────────────────────────
  const skills = (cert.event.skills as string[]) ?? []
  const skillLine = skills.slice(0, 5).join("   ·   ")
  const proceduralFont = "Arial, Helvetica, sans-serif"
  const extraSvg = !tpl?.imageUrl ? rasterizeSvg(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  ${skillLine ? `<text x="${W / 2}" y="490" text-anchor="middle"
        font-family="${proceduralFont}" font-size="13" fill="#2563EB" letter-spacing="1">
    ${escapeXml(skillLine)}</text>` : ""}
  <text x="60" y="678" font-family="${proceduralFont}" font-size="10" fill="#94A3B8" letter-spacing="2">EVENT DATE</text>
  <text x="60" y="698" font-family="${proceduralFont}" font-size="14" font-weight="bold" fill="#475569">${escapeXml(fmt(cert.event.eventDate))}</text>
  <text x="60" y="722" font-family="${proceduralFont}" font-size="10" fill="#94A3B8" letter-spacing="2">ISSUED ON</text>
  <text x="60" y="742" font-family="${proceduralFont}" font-size="14" font-weight="bold" fill="#475569">${escapeXml(fmt(cert.createdAt))}</text>
</svg>`) : null

  // ── Additional placeholders ───────────────────────────────────────────────
  // Per-certificate values (e.g. a paper title/committee role stored in
  // Certificate.metadata) override a placeholder's static value at render time,
  // keyed by placeholder id — same convention as lib/certificate-generator.ts.
  const certMetadata = cert.metadata as Record<string, unknown> | null
  const dynamicValues: Record<string, string> | undefined = certMetadata?.others
    ? { others: String(certMetadata.others) }
    : undefined
  const additionalPlaceholders = (tpl?.additional ?? []) as unknown as AdditionalPlaceholder[]
  const additionalTexts = additionalPlaceholders
    .map(p => {
      const value = dynamicValues?.[p.id] ?? p.value
      if (!value) return ""
      const fontSize = safeNum(p.fontSize, 14)
      const x = safeNum(p.x, 0)
      const y = safeNum(p.y, 0)
      const commonAttrs = `text-anchor="${p.align ?? "middle"}" font-family="${escapeXml(p.font)}" ${p.bold ? 'font-weight="bold"' : ""} fill="${escapeXml(p.color)}"`

      // Long per-certificate values (e.g. a paper title) wrap onto multiple lines instead
      // of overflowing past the box on one — same convention as buildAdditionalsSVG.
      if (p.maxWidth) {
        const wrapped = wrapNameText(value, fontSize, safeNum(p.maxWidth, 400))
        const lineHeight = wrapped.fontSize * 1.15
        const firstLineY = y - ((wrapped.lines.length - 1) * lineHeight) / 2
        const tspans = wrapped.lines
          .map((line, i) => `<tspan x="${x}" y="${firstLineY + i * lineHeight}">${escapeXml(line)}</tspan>`)
          .join("")
        return `  <text dominant-baseline="middle" font-size="${wrapped.fontSize}px" ${commonAttrs}>${tspans}</text>`
      }

      return `  <text
    x="${x}" y="${y}" dominant-baseline="middle"
    font-size="${fontSize}px" ${commonAttrs}>${escapeXml(value)}</text>`
    })
    .filter(Boolean)
  const additionalSvg = additionalTexts.length > 0
    ? rasterizeSvg(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
${additionalTexts.join("\n")}
</svg>`)
    : null

  // ── Composite ─────────────────────────────────────────────────────────────
  const layers: sharp.OverlayOptions[] = [
    { input: nameSvg, top: 0, left: 0 },
    { input: qrBuffer, top: Math.round(qrY), left: Math.round(qrX) },
    { input: certIdSvg, top: 0, left: 0 },
  ]
  if (extraSvg) layers.push({ input: extraSvg, top: 0, left: 0 })
  if (additionalSvg) layers.push({ input: additionalSvg, top: 0, left: 0 })

  const finalPng = await sharp(templatePng).composite(layers).png().toBuffer()

  return new Response(finalPng.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300",
    },
  })
}
