import "server-only"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { buildCertUrl } from "@/lib/certificate-generator"
import { sendCertificateEmail } from "@/lib/email"

// Space sends out to avoid tripping free-tier SMTP burst limits.
const SEND_DELAY_MS = 300

// Resend's free-plan account limit is 100 emails/day. Cap at 80 platform-wide
// (across every organizer, not per-account) to leave headroom under that cap.
// Anything beyond the cap is left QUEUED — it isn't lost, just picked up again
// the next time anyone sends after the day rolls over (there's no cron here).
const DAILY_SEND_LIMIT = 80

// Any status except SENT (and PENDING, which has no generated image yet)
// is resendable — a FAILED or BOUNCED cert can simply be tried again.
const RESENDABLE_STATUSES: Prisma.EnumEmailStatusFilter["in"] = ["QUEUED", "FAILED", "BOUNCED"]

export interface SendResult {
  attempted: number
  sent: number
  failed: number
  remaining: number
  dailyLimitReached: boolean
}

export async function sendQueuedCertificates(
  where: Prisma.CertificateWhereInput,
  cap: number
): Promise<SendResult> {
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)
  const sentToday = await prisma.certificate.count({
    where: { emailStatus: "SENT", sentAt: { gte: todayStart } },
  })
  const budget = Math.max(0, DAILY_SEND_LIMIT - sentToday)
  const effectiveCap = Math.min(cap, budget)

  if (effectiveCap === 0) {
    const remaining = await prisma.certificate.count({
      where: { ...where, emailStatus: { in: RESENDABLE_STATUSES } },
    })
    return { attempted: 0, sent: 0, failed: 0, remaining, dailyLimitReached: true }
  }

  const certs = await prisma.certificate.findMany({
    where: { ...where, emailStatus: { in: RESENDABLE_STATUSES } },
    take: effectiveCap,
    orderBy: { queuedAt: "asc" },
    select: {
      certId: true,
      participantName: true,
      participantEmail: true,
      event: { select: { eventName: true, organizer: { select: { orgName: true } } } },
    },
  })

  let sent = 0
  let failed = 0

  for (const cert of certs) {
    const certUrl = buildCertUrl(
      { baseUrl: process.env.NEXTAUTH_URL ?? "http://localhost:3000", viewPageName: "view" },
      cert.certId
    )

    try {
      await sendCertificateEmail(cert.participantEmail, {
        participantName: cert.participantName,
        eventName: cert.event.eventName,
        orgName: cert.event.organizer.orgName,
        certUrl,
      })
      await prisma.certificate.update({
        where: { certId: cert.certId },
        data: { emailStatus: "SENT", sendAttempts: { increment: 1 }, sentAt: new Date() },
      })
      sent++
    } catch (err) {
      console.error(`[send-certificates] failed to email ${cert.certId} (${cert.participantEmail}):`, err)
      await prisma.certificate.update({
        where: { certId: cert.certId },
        data: { emailStatus: "FAILED", sendAttempts: { increment: 1 } },
      })
      failed++
    }

    await new Promise(r => setTimeout(r, SEND_DELAY_MS))
  }

  const remaining = await prisma.certificate.count({
    where: { ...where, emailStatus: { in: RESENDABLE_STATUSES } },
  })

  return { attempted: certs.length, sent, failed, remaining, dailyLimitReached: sentToday + sent >= DAILY_SEND_LIMIT }
}
