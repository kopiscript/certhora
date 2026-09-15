import "server-only"
import { prisma } from "@/lib/prisma"
import { uploadToR2 } from "@/lib/r2"
import {
  generateCertificateBatch,
  buildProceduralTemplate,
  CERT_W,
  CERT_H,
  type NameLayout,
  type QRLayout,
  type CertDesign,
  type URLConfig,
  type AdditionalPlaceholder,
} from "@/lib/certificate-generator"
import sharp from "sharp"
import { applyPendingTierChange, applyExpiredSubscription } from "@/lib/billing"

// Maps a participant's CSV-supplied extra columns (Certificate.metadata, keyed by
// raw column header) onto the template's text placeholders by matching column
// header to placeholder label case-insensitively — e.g. a "Track" column fills
// a placeholder labeled "Track". Falls back to the placeholder's static value
// when no matching column was supplied.
function buildDynamicValues(
  metadata: unknown,
  placeholders: AdditionalPlaceholder[]
): Record<string, string> | undefined {
  if (!metadata || typeof metadata !== "object" || placeholders.length === 0) return undefined

  const entries = Object.entries(metadata as Record<string, unknown>)
  const dynamicValues: Record<string, string> = {}
  for (const ph of placeholders) {
    const match = entries.find(([key]) => key.trim().toLowerCase() === ph.label.trim().toLowerCase())
    if (match && match[1]) dynamicValues[ph.id] = String(match[1])
  }
  return Object.keys(dynamicValues).length > 0 ? dynamicValues : undefined
}

export interface GenerateOutcome {
  generated: number
  results: { certId: string; name: string; qrUrl: string }[]
  error?: string
}

// Generates certificate images for every PENDING participant of an event and
// flips them to QUEUED. Shared by the explicit "Generate Certificates" button
// and the send-emails routes, which now auto-generate before sending so
// organizers don't have to click Generate first.
export async function generatePendingCertificates(
  eventCode: string,
  organizerCd: string
): Promise<GenerateOutcome> {
  await applyPendingTierChange(organizerCd)
  await applyExpiredSubscription(organizerCd)

  const organizer = await prisma.organizer.findUnique({
    where: { organizerCd },
    select: { organizerCd: true, certQuota: true },
  })
  if (!organizer) return { generated: 0, results: [], error: "Organizer not found" }

  const event = await prisma.event.findUnique({
    where: { eventCode },
    include: {
      organizer: { select: { orgName: true } },
      template: true, // 1-to-1, eventCode PK
    },
  })
  if (!event || event.organizerCd !== organizer.organizerCd) {
    return { generated: 0, results: [], error: "Event not found" }
  }

  const pendingCerts = await prisma.certificate.findMany({
    where: { eventCode, emailStatus: "PENDING" },
    select: { certId: true, participantName: true, metadata: true },
  })
  if (pendingCerts.length === 0) return { generated: 0, results: [] }

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
    return {
      generated: 0,
      results: [],
      error: `Quota exceeded. ${remaining} remaining, ${pendingCerts.length} requested.`,
    }
  }

  // ── Build template buffer ─────────────────────────────────────────────────
  let templateBuffer: Buffer

  if (event.template?.imageUrl) {
    try {
      const res = await fetch(
        event.template.imageUrl.startsWith("/")
          ? `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}${event.template.imageUrl}`
          : event.template.imageUrl
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const svgOrImage = Buffer.from(await res.arrayBuffer())
      // Normalize to the canonical canvas so overlay coordinates (stored in
      // 1200×840 space by the template editor) land in the right spot
      // regardless of the uploaded image's native resolution.
      templateBuffer = await sharp(svgOrImage)
        .resize(CERT_W, CERT_H, { fit: "cover" })
        .png()
        .toBuffer()
    } catch (err) {
      return { generated: 0, results: [], error: `Failed to load template image: ${(err as Error).message}` }
    }
  } else {
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
      pendingCerts.map(c => ({
        certId: c.certId,
        name: c.participantName,
        dynamicValues: buildDynamicValues(c.metadata, additional),
      })),
      nameLayout,
      qrLayout,
      design,
      urlConfig,
      undefined,
      5,
      additional
    )
  } catch (err) {
    return { generated: 0, results: [], error: `Generation failed: ${(err as Error).message}` }
  }

  // ── Upload certificate images to R2 ──────────────────────────────────────
  const uploadedAt = new Date()
  const imageUrls = await Promise.all(
    outputs.map(async o => {
      const url = await uploadToR2(`certificates/${o.certId}.png`, o.imageBuffer, "image/png")
      return `${url}?v=${uploadedAt.getTime()}`
    })
  )

  // ── Persist — update status to QUEUED ────────────────────────────────────
  await Promise.all(
    outputs.map((o, i) =>
      prisma.certificate.update({
        where: { certId: o.certId },
        data: { emailStatus: "QUEUED", queuedAt: uploadedAt, imageUrl: imageUrls[i] },
      })
    )
  )

  await prisma.event.update({
    where: { eventCode },
    data: { status: "ACTIVE", issuedDate: new Date() },
  })

  return {
    generated: outputs.length,
    results: outputs.map(o => ({ certId: o.certId, name: o.name, qrUrl: o.qrUrl })),
  }
}
