import "server-only"
import { prisma } from "@/lib/prisma"
import { uploadToR2 } from "@/lib/r2"
import { generateCertificateBatch } from "@/lib/certificate-generator"
import { loadRenderContext, buildDynamicValues } from "@/lib/render-certificate"
import { applyPendingTierChange, applyExpiredSubscription } from "@/lib/billing"

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

  // ── Template + layout (shared with the live preview) ──────────────────────
  let ctx
  try {
    ctx = await loadRenderContext(event)
  } catch (err) {
    return { generated: 0, results: [], error: (err as Error).message }
  }
  const { templateBuffer, nameLayout, qrLayout, design, urlConfig, additional } = ctx

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
