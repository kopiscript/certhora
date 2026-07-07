import "server-only"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { buildCertUrl } from "@/lib/certificate-generator"
import { sendCertificateEmail } from "@/lib/email"

// Space sends out to avoid tripping free-tier SMTP burst limits.
const SEND_DELAY_MS = 300

// Any status except SENT (and PENDING, which has no generated image yet)
// is resendable — a FAILED or BOUNCED cert can simply be tried again.
const RESENDABLE_STATUSES: Prisma.EnumEmailStatusFilter["in"] = ["QUEUED", "FAILED", "BOUNCED"]

export interface SendResult {
  attempted: number
  sent: number
  failed: number
}

export async function sendQueuedCertificates(
  where: Prisma.CertificateWhereInput,
  cap: number
): Promise<SendResult> {
  const certs = await prisma.certificate.findMany({
    where: { ...where, emailStatus: { in: RESENDABLE_STATUSES } },
    take: cap,
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
        data: { emailStatus: "SENT", sendAttempts: { increment: 1 } },
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

  return { attempted: certs.length, sent, failed }
}
