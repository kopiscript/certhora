import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadToR2 } from "@/lib/r2"
import {
  generateCertificateBatch,
  buildProceduralTemplate,
  type NameLayout,
  type QRLayout,
  type CertDesign,
  type URLConfig,
  type AdditionalPlaceholder,
} from "@/lib/certificate-generator"
import sharp from "sharp"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ eventCode: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { eventCode } = await params

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
    select: { organizerCd: true, certQuota: true },
  })
  if (!organizer) return NextResponse.json({ error: "Organizer not found" }, { status: 404 })

  const event = await prisma.event.findUnique({
    where: { eventCode },
    include: {
      organizer: { select: { orgName: true } },
      template: true,   // 1-to-1, eventCode PK
    },
  })
  if (!event || event.organizerCd !== organizer.organizerCd) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  // ── Pending participants ──────────────────────────────────────────────────
  const pendingCerts = await prisma.certificate.findMany({
    where: { eventCode, emailStatus: "PENDING" },
    select: { certId: true, participantName: true },
  })
  if (pendingCerts.length === 0) {
    return NextResponse.json({ error: "No pending participants for this event" }, { status: 404 })
  }

  // ── Quota guard ───────────────────────────────────────────────────────────
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const usedThisMonth = await prisma.certificate.count({
    where: {
      event: { organizerCd: organizer.organizerCd },
      createdAt: { gte: monthStart },
      emailStatus: { not: "PENDING" },
    },
  })
  const remaining = organizer.certQuota - usedThisMonth
  if (pendingCerts.length > remaining) {
    return NextResponse.json(
      { error: `Quota exceeded. ${remaining} remaining, ${pendingCerts.length} requested.`, remaining },
      { status: 422 }
    )
  }

  // ── Build template buffer ─────────────────────────────────────────────────
  let templateBuffer: Buffer

  if (event.template?.imageUrl) {
    // Fetch uploaded template image
    try {
      const res = await fetch(
        event.template.imageUrl.startsWith("/")
          ? `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}${event.template.imageUrl}`
          : event.template.imageUrl
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const svgOrImage = Buffer.from(await res.arrayBuffer())
      templateBuffer = await sharp(svgOrImage).png().toBuffer()
    } catch (err) {
      return NextResponse.json(
        { error: `Failed to load template image: ${(err as Error).message}` },
        { status: 400 }
      )
    }
  } else {
    // Procedural template
    const svg = buildProceduralTemplate({
      eventName: event.eventName,
      organizerName: event.organizer.orgName,
      primaryColor: event.template?.primaryColor ?? "#1D4ED8",
    })
    templateBuffer = await sharp(svg).png().toBuffer()
  }

  // ── Layout config (from template or defaults) ─────────────────────────────
  const tpl = event.template
  const nameLayout: NameLayout = {
    centerX:       tpl?.nameCenterX  ?? 600,
    y:             tpl?.nameY        ?? 340,
    maxWidth:      tpl?.nameMaxWidth ?? 840,
    defaultFontSize: tpl?.nameFontSize ?? 52,
    nameFont:      tpl?.nameFont     ?? "Arial, Helvetica, sans-serif",
    nameColor:     tpl?.nameColor    ?? "#1E293B",
  }
  const qrLayout: QRLayout = {
    x:    tpl?.qrX    ?? 1010,
    y:    tpl?.qrY    ?? 628,
    size: tpl?.qrSize ?? 140,
  }
  const design: CertDesign = {
    certIdFont:   tpl?.certIdFont   ?? "monospace",
    certIdColor:  tpl?.certIdColor  ?? "#64748B",
    showWatermark: tpl?.showWatermark ?? false,
  }
  const urlConfig: URLConfig = {
    baseUrl:      process.env.NEXTAUTH_URL ?? "http://localhost:3000",
    viewPageName: "view",
  }

  const additional = (tpl?.additional ?? []) as unknown as AdditionalPlaceholder[]

  // ── Generate ──────────────────────────────────────────────────────────────
  let outputs
  try {
    outputs = await generateCertificateBatch(
      templateBuffer,
      pendingCerts.map(c => ({ certId: c.certId, name: c.participantName })),
      nameLayout,
      qrLayout,
      design,
      urlConfig,
      undefined,
      5,
      additional
    )
  } catch (err) {
    return NextResponse.json(
      { error: `Generation failed: ${(err as Error).message}` },
      { status: 500 }
    )
  }

  // ── Upload certificate images to R2 ──────────────────────────────────────
  const uploadedAt = new Date()
  const imageUrls = await Promise.all(
    outputs.map(o =>
      uploadToR2(`certificates/${o.certId}.png`, o.imageBuffer, "image/png")
    )
  )

  // ── Persist — update status to QUEUED ────────────────────────────────────
  await prisma.$transaction(
    outputs.map((o, i) =>
      prisma.certificate.update({
        where: { certId: o.certId },
        data: { emailStatus: "QUEUED", queuedAt: uploadedAt, imageUrl: imageUrls[i] },
      })
    )
  )

  // Also mark event as ACTIVE
  await prisma.event.update({
    where: { eventCode },
    data: { status: "ACTIVE", issuedDate: new Date() },
  })

  return NextResponse.json({
    success: true,
    eventCode,
    generated: outputs.length,
    results: outputs.map(o => ({ certId: o.certId, name: o.name, qrUrl: o.qrUrl })),
  })
}
