import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CheckCircle, Calendar, Share2, ExternalLink, Eye } from "lucide-react"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ viewPage: string; certId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { certId } = await params
  const cert = await prisma.certificate.findUnique({
    where: { certId },
    select: { participantName: true, event: { select: { eventName: true } } },
  })
  if (!cert) return { title: "Certificate Not Found" }
  return {
    title: `${cert.participantName} — ${cert.event.eventName}`,
    description: `View and verify the certificate issued to ${cert.participantName}`,
  }
}

export default async function CertViewPage({ params }: Props) {
  const { certId } = await params

  const cert = await prisma.certificate.findUnique({
    where: { certId },
    include: {
      event: {
        include: {
          organizer: { select: { orgName: true, socialLink: true } },
        },
      },
    },
  })

  if (!cert) notFound()

  const event = cert.event
  const organizer = event.organizer

  const issueDate = cert.createdAt
    ? new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "long", year: "numeric" }).format(cert.createdAt)
    : null

  const eventDate = event.eventDate
    ? new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "long", year: "numeric" }).format(event.eventDate)
    : null

  const expiryDate = event.expiryDate
    ? new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "long", year: "numeric" }).format(event.expiryDate)
    : null

  const isExpired = event.expiryDate ? new Date() > event.expiryDate : false

  return (
    <main
      style={{ background: "var(--ct-bg)", minHeight: "100vh", padding: "32px 16px" }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span
            style={{
              display: "inline-block",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ct-blue)",
              background: "var(--ct-blue-dim)",
              border: "1px solid rgba(37,99,235,0.20)",
              borderRadius: 6,
              padding: "4px 12px",
              marginBottom: 16,
            }}
          >
            Certificate of Completion
          </span>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "var(--ct-text)",
              margin: "0 0 8px",
              lineHeight: 1.2,
            }}
          >
            {cert.participantName}
          </h1>
          <p style={{ fontSize: 15, color: "var(--ct-text-2)", margin: 0 }}>
            {event.eventName}
          </p>
        </div>

        {/* Verification badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: isExpired ? "rgba(248,113,113,0.06)" : "rgba(34,197,94,0.06)",
            border: `1px solid ${isExpired ? "rgba(248,113,113,0.18)" : "rgba(34,197,94,0.18)"}`,
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 24,
          }}
        >
          <CheckCircle
            size={18}
            style={{ color: isExpired ? "#F87171" : "#22C55E", flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: isExpired ? "#F87171" : "#22C55E",
              }}
            >
              {isExpired ? "Certificate Expired" : "Verified Certificate"}
            </span>
            <span style={{ fontSize: 13, color: "var(--ct-text-2)", marginLeft: 8 }}>
              · ID: <span style={{ fontFamily: "monospace", color: "var(--ct-text)" }}>{cert.certId}</span>
            </span>
          </div>
          {!isExpired && expiryDate && (
            <span style={{ fontSize: 12, color: "var(--ct-text-2)" }}>
              Valid until {expiryDate}
            </span>
          )}
        </div>

        {/* Main card */}
        <div
          style={{
            background: "var(--ct-surface)",
            border: "1px solid var(--ct-border)",
            borderRadius: 14,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          {/* Certificate image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/certs/${cert.certId}/preview`}
            alt={`Certificate for ${cert.participantName}`}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              borderBottom: "1px solid var(--ct-border)",
            }}
          />

          {/* Details grid */}
          <div style={{ padding: 24 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <DetailItem label="Issued by" value={organizer.orgName} />
              <DetailItem label="Certificate ID" value={cert.certId} mono />
              {eventDate && <DetailItem label="Event Date" value={eventDate} icon={<Calendar size={13} />} />}
              {issueDate && <DetailItem label="Issued On" value={issueDate} />}
            </div>

            {/* Skills */}
            {event.skills && (event.skills as string[]).length > 0 && (
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--ct-text-2)",
                    marginBottom: 8,
                  }}
                >
                  Skills Covered
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(event.skills as string[]).map(skill => (
                    <span
                      key={skill}
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        background: "var(--ct-blue-dim)",
                        border: "1px solid rgba(37,99,235,0.18)",
                        color: "#93C5FD",
                        borderRadius: 6,
                        padding: "3px 10px",
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--ct-border)" }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--ct-text-2)",
                    marginBottom: 8,
                  }}
                >
                  About this Event
                </p>
                <p style={{ fontSize: 14, color: "var(--ct-text-2)", lineHeight: 1.65, margin: 0 }}>
                  {event.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <StatCard icon={<Eye size={15} />} label="Views" value={cert.viewCount ?? 0} />
          <StatCard icon={<Share2 size={15} />} label="Shares" value={cert.shareCount ?? 0} />
        </div>

        {/* Share + organizer link */}
        <div style={{ display: "flex", gap: 10 }}>
          {organizer.socialLink && (
            <a
              href={organizer.socialLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                height: 42,
                background: "var(--ct-surface)",
                border: "1px solid var(--ct-border)",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: "var(--ct-text-2)",
                textDecoration: "none",
                transition: "border-color 150ms ease, color 150ms ease",
              }}
            >
              <ExternalLink size={14} />
              {organizer.orgName}
            </a>
          )}
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "var(--ct-text-3)",
            marginTop: 28,
          }}
        >
          Issued and verified by{" "}
          <span style={{ color: "var(--ct-blue)", fontWeight: 600 }}>Certhora</span>
          {" "}· certhora.com
        </p>
      </div>
    </main>
  )
}

function DetailItem({
  label,
  value,
  mono,
  icon,
}: {
  label: string
  value: string
  mono?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div>
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--ct-text-2)",
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "var(--ct-text)",
          fontFamily: mono ? "monospace" : undefined,
          display: "flex",
          alignItems: "center",
          gap: 5,
          margin: 0,
        }}
      >
        {icon}
        {value}
      </p>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div
      style={{
        background: "var(--ct-surface)",
        border: "1px solid var(--ct-border)",
        borderRadius: 10,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ color: "var(--ct-blue)" }}>{icon}</span>
      <div>
        <p style={{ fontSize: 18, fontWeight: 700, color: "var(--ct-text)", margin: 0 }}>
          {value.toLocaleString()}
        </p>
        <p style={{ fontSize: 12, color: "var(--ct-text-2)", margin: 0 }}>{label}</p>
      </div>
    </div>
  )
}
