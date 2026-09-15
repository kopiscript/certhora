import "server-only"
import { Resend } from "resend"

const globalForMailer = globalThis as unknown as {
  resend: Resend | undefined
}

function getResend() {
  if (!globalForMailer.resend) {
    globalForMailer.resend = new Resend(process.env.RESEND_API_KEY)
  }
  return globalForMailer.resend
}

export interface CertificateEmailOptions {
  participantName: string
  eventName: string
  orgName: string
  certUrl: string
}

export async function sendCertificateEmail(to: string, opts: CertificateEmailOptions) {
  const { participantName, eventName, orgName, certUrl } = opts

  const { error } = await getResend().emails.send({
    from: process.env.RESEND_FROM ?? process.env.SMTP_FROM ?? "Certhora <no-reply@certhora.com>",
    to,
    subject: `Your certificate for ${eventName} is ready`,
    text:
      `Hi ${participantName},\n\n` +
      `Your certificate for "${eventName}", issued by ${orgName}, is ready.\n\n` +
      `View and download it here: ${certUrl}\n\n` +
      `— Certhora`,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #1E293B;">
        <p>Hi ${escapeHtml(participantName)},</p>
        <p>Your certificate for <strong>${escapeHtml(eventName)}</strong>, issued by ${escapeHtml(orgName)}, is ready.</p>
        <p style="margin: 24px 0;">
          <a href="${certUrl}" style="background: #1D4ED8; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">
            View your certificate
          </a>
        </p>
        <p style="color: #64748B; font-size: 13px;">Or copy this link: ${certUrl}</p>
        <p style="color: #94A3B8; font-size: 12px; margin-top: 32px;">Sent via Certhora</p>
      </div>
    `,
  })

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`)
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
