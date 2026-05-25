import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import sharp from "sharp"
import QRCode from "qrcode"
import {
  buildProceduralTemplate,
  calcScaledFontSize,
} from "@/lib/certificate-generator"

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
      templatePng = await sharp(buildProceduralTemplate({
        eventName: cert.event.eventName,
        organizerName: cert.event.organizer.orgName,
        primaryColor: tpl?.primaryColor ?? "#1D4ED8",
      })).png().toBuffer()
    } else {
      templatePng = await sharp(Buffer.from(await res.arrayBuffer())).png().toBuffer()
    }
  } else {
    templatePng = await sharp(buildProceduralTemplate({
      eventName: cert.event.eventName,
      organizerName: cert.event.organizer.orgName,
      primaryColor: tpl?.primaryColor ?? "#1D4ED8",
    })).png().toBuffer()
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
  const fontSize = calcScaledFontSize(cert.participantName, nameFontSize, nameMaxWidth)
  const nameSvg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <text x="${nameCenterX}" y="${nameY}" text-anchor="middle" dominant-baseline="middle"
        font-family="${escapeXml(nameFont)}" font-size="${fontSize}px"
        font-weight="bold" fill="${escapeXml(nameColor)}">${escapeXml(cert.participantName)}</text>
</svg>`)

  // ── Cert ID SVG ───────────────────────────────────────────────────────────
  const certIdX = qrX + qrSize / 2
  const certIdY = qrY + qrSize + 18
  const certIdSvg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
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
  const extraSvg = !tpl?.imageUrl ? Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  ${skillLine ? `<text x="${W / 2}" y="490" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#2563EB" letter-spacing="1">
    ${escapeXml(skillLine)}</text>` : ""}
  <text x="60" y="678" font-family="Arial, Helvetica, sans-serif" font-size="10" fill="#94A3B8" letter-spacing="2">EVENT DATE</text>
  <text x="60" y="698" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="bold" fill="#475569">${escapeXml(fmt(cert.event.eventDate))}</text>
  <text x="60" y="722" font-family="Arial, Helvetica, sans-serif" font-size="10" fill="#94A3B8" letter-spacing="2">ISSUED ON</text>
  <text x="60" y="742" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="bold" fill="#475569">${escapeXml(fmt(cert.createdAt))}</text>
</svg>`) : null

  // ── Composite ─────────────────────────────────────────────────────────────
  const layers: sharp.OverlayOptions[] = [
    { input: nameSvg, top: 0, left: 0 },
    { input: qrBuffer, top: Math.round(qrY), left: Math.round(qrX) },
    { input: certIdSvg, top: 0, left: 0 },
  ]
  if (extraSvg) layers.push({ input: extraSvg, top: 0, left: 0 })

  const finalPng = await sharp(templatePng).composite(layers).png().toBuffer()

  return new Response(finalPng.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300",
    },
  })
}
