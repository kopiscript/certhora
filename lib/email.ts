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
    html: buildCertificateEmailHtml({
      participantName,
      eventName,
      orgName,
      certUrl,
      logoUrl: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/certhoralogo.png`,
    }),
  })

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`)
  }
}

function buildCertificateEmailHtml(opts: CertificateEmailOptions & { logoUrl: string }): string {
  const { participantName, eventName, orgName, certUrl, logoUrl } = opts
  const name = escapeHtml(participantName)
  const event = escapeHtml(eventName)
  const org = escapeHtml(orgName)

  return `
<!DOCTYPE html>
<html lang="en">
  <body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F1F5F9; padding: 40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0;">

            <tr>
              <td style="background-color: #0B1120; padding: 24px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right: 10px;">
                      <img
                        src="${logoUrl}"
                        alt="Certhora"
                        width="24"
                        height="24"
                        style="display: block; width: 24px; height: 24px; color: #ffffff; font-size: 12px; font-weight: 700;"
                      />
                    </td>
                    <td style="font-size: 18px; font-weight: 700; letter-spacing: -0.01em; color: #ffffff; vertical-align: middle;">
                      Certhora
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 40px 32px 8px;">
                <p style="margin: 0 0 4px; color: #2563EB; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">
                  Certificate ready
                </p>
                <h1 style="margin: 0 0 20px; color: #0F172A; font-size: 22px; font-weight: 700; line-height: 1.3;">
                  Hi ${name}, your certificate has arrived
                </h1>
                <p style="margin: 0 0 28px; color: #475569; font-size: 15px; line-height: 1.6;">
                  You've successfully completed <strong style="color: #0F172A;">${event}</strong>, issued by
                  <strong style="color: #0F172A;">${org}</strong>. Your verified digital certificate is ready to view and download.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding: 0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px;">
                  <tr>
                    <td style="padding: 20px 24px;">
                      <p style="margin: 0 0 2px; color: #94A3B8; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;">Event</p>
                      <p style="margin: 0 0 16px; color: #0F172A; font-size: 14px; font-weight: 600;">${event}</p>
                      <p style="margin: 0 0 2px; color: #94A3B8; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;">Issued by</p>
                      <p style="margin: 0; color: #0F172A; font-size: 14px; font-weight: 600;">${org}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding: 28px 32px 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="border-radius: 10px; background-color: #2563EB;">
                      <a href="${certUrl}" style="display: inline-block; padding: 14px 32px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none;">
                        View your certificate
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 16px 32px 40px;">
                <p style="margin: 0; color: #94A3B8; font-size: 12px; line-height: 1.6; text-align: center; word-break: break-all;">
                  Or copy this link into your browser:<br />
                  <a href="${certUrl}" style="color: #2563EB; text-decoration: none;">${certUrl}</a>
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding: 20px 32px; border-top: 1px solid #E2E8F0;">
                <p style="margin: 0; color: #94A3B8; font-size: 12px; text-align: center;">
                  Sent via <strong style="color: #64748B;">Certhora</strong> &middot; Verified digital certificates
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
