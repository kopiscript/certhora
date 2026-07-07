import "server-only"
import nodemailer from "nodemailer"

const globalForMailer = globalThis as unknown as {
  mailer: nodemailer.Transporter | undefined
}

function getTransporter() {
  if (!globalForMailer.mailer) {
    const port = Number(process.env.SMTP_PORT ?? 587)
    globalForMailer.mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  }
  return globalForMailer.mailer
}

export interface CertificateEmailOptions {
  participantName: string
  eventName: string
  orgName: string
  certUrl: string
}

export async function sendCertificateEmail(to: string, opts: CertificateEmailOptions) {
  const { participantName, eventName, orgName, certUrl } = opts

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM,
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
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
