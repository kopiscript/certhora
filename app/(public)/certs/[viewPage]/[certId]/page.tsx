export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CheckCircle, AlertTriangle, Clock, Calendar, Building2, BadgeCheck, Hash } from 'lucide-react'
import type { Metadata } from 'next'
import CertCanvas from './CertCanvas'
import ShareActions from './ShareActions'
import FeedbackForm from './FeedbackForm'

interface Props {
  params: Promise<{ viewPage: string; certId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { certId } = await params
  const cert = await prisma.certificate.findUnique({
    where: { certId },
    select: { participantName: true, event: { select: { eventName: true } } },
  })
  if (!cert) return { title: 'Certificate Not Found — Certhora' }
  return {
    title: `${cert.participantName} — ${cert.event.eventName} | Certhora`,
    description: `Verified digital certificate issued to ${cert.participantName} for completing ${cert.event.eventName}.`,
  }
}

const fmt = (d: Date | null | undefined) =>
  d ? new Intl.DateTimeFormat('en-MY', { day: 'numeric', month: 'long', year: 'numeric' }).format(d) : null

export default async function CertViewPage({ params }: Props) {
  const { certId } = await params

  const cert = await prisma.certificate.findUnique({
    where: { certId },
    include: {
      event: {
        include: {
          organizer: { select: { orgName: true, socialLink: true } },
          template: { select: { primaryColor: true } },
        },
      },
    },
  })

  if (!cert) notFound()

  // `viewPage` is a cosmetic URL slug only — `certId` is the actual lookup
  // key, so it isn't validated separately here.
  await prisma.certificate.update({
    where: { certId },
    data: { viewCount: { increment: 1 } },
  })

  const event = cert.event
  const organizer = event.organizer
  const skills = event.skills as string[]

  const issueDate = fmt(cert.createdAt)
  const eventDate = fmt(event.eventDate)
  const expiryDate = fmt(event.expiryDate)
  const isExpired = event.expiryDate ? new Date() > event.expiryDate : false
  const primaryColor = event.template?.primaryColor ?? '#1D4ED8'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ct-bg)' }}>

      {/* ── Top nav ───────────────────────────────────────────────────────── */}
      <nav
        style={{
          borderBottom: '1px solid var(--ct-border)',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          position: 'sticky',
          top: 0,
          background: 'rgba(7,7,15,0.82)',
          backdropFilter: 'blur(14px)',
          zIndex: 50,
        }}
      >
        <div
          style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--ct-blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 14, color: '#fff',
            flexShrink: 0,
          }}
        >
          C
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ct-text)', letterSpacing: '-0.01em' }}>
          Certhora
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: 'var(--ct-text-3)',
          }}
        >
          Credential Verification
        </span>
      </nav>

      {/* ── Page body ─────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1240, margin: '0 auto', padding: '52px 24px 96px' }}>

        {/* Verification status banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 20px',
            borderRadius: 12,
            marginBottom: 48,
            background: isExpired
              ? 'rgba(248,113,113,0.07)'
              : 'rgba(34,197,94,0.07)',
            border: `1px solid ${isExpired ? 'rgba(248,113,113,0.22)' : 'rgba(34,197,94,0.22)'}`,
          }}
        >
          {isExpired
            ? <AlertTriangle size={17} style={{ color: '#F87171', flexShrink: 0 }} />
            : <CheckCircle size={17} style={{ color: '#22C55E', flexShrink: 0 }} />}

          <span
            style={{
              fontSize: 13, fontWeight: 600,
              color: isExpired ? '#F87171' : '#22C55E',
            }}
          >
            {isExpired ? 'Certificate Expired' : 'Verified & Authentic Certificate'}
          </span>

          <span style={{ fontSize: 13, color: 'var(--ct-text-3)', marginLeft: 4 }}>·</span>
          <span style={{ fontSize: 13, color: 'var(--ct-text-2)' }}>
            Credential ID:{' '}
            <span style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--ct-text)' }}>
              {cert.certId}
            </span>
          </span>

          {!isExpired && expiryDate && (
            <span
              style={{
                marginLeft: 'auto',
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, color: 'var(--ct-text-3)',
              }}
            >
              <Clock size={12} />
              Valid until {expiryDate}
            </span>
          )}
        </div>

        {/* ── Two-column grid ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 items-start">

          {/* ═══ LEFT: Certificate canvas + feedback ═════════════════════ */}
          <div className="min-w-0 flex flex-col gap-6">
            <CertCanvas
              certId={cert.certId}
              participantName={cert.participantName}
              hasBadge={event.hasBadge}
              badgeUrl={event.badgeUrl}
              primaryColor={primaryColor}
            />
            <FeedbackForm
              eventCode={event.eventCode}
              eventName={event.eventName}
            />
          </div>

          {/* ═══ RIGHT: Metadata column ══════════════════════════════════ */}
          <div className="min-w-0 flex flex-col gap-6">

            {/* Header */}
            <div>
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--ct-blue)',
                  background: 'var(--ct-blue-dim)',
                  border: '1px solid rgba(37,99,235,0.22)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  marginBottom: 14,
                }}
              >
                <BadgeCheck size={12} />
                Certificate of Completion
              </span>

              <h1
                style={{
                  fontSize: 'clamp(24px, 4vw, 34px)',
                  fontWeight: 800,
                  color: 'var(--ct-text)',
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  margin: '0 0 8px',
                }}
              >
                {cert.participantName}
              </h1>
              <p style={{ fontSize: 16, color: 'var(--ct-text-2)', margin: 0, lineHeight: 1.5 }}>
                {event.eventName}
              </p>
            </div>

            {/* ── Core issuance block ─────────────────────────────────── */}
            <div
              style={{
                background: 'var(--ct-surface)',
                border: '1px solid var(--ct-border)',
                borderRadius: 14,
                padding: 24,
              }}
            >
              <SectionLabel>Credential Details</SectionLabel>

              <div className="grid grid-cols-2 gap-5 mt-4">
                {issueDate && (
                  <MetaItem icon={<BadgeCheck size={13} />} label="Issued On" value={issueDate} />
                )}
                <MetaItem icon={<Building2 size={13} />} label="Issued By" value={organizer.orgName} />
                {eventDate && (
                  <MetaItem icon={<Calendar size={13} />} label="Event Date" value={eventDate} />
                )}
                <MetaItem icon={<Hash size={13} />} label="Credential ID" value={cert.certId} mono />
              </div>

              {/* Expiry pill */}
              {expiryDate && (
                <div
                  style={{
                    marginTop: 18,
                    paddingTop: 18,
                    borderTop: '1px solid var(--ct-border)',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '7px 14px',
                      borderRadius: 8,
                      background: isExpired ? 'rgba(248,113,113,0.08)' : 'rgba(251,191,36,0.08)',
                      border: `1px solid ${isExpired ? 'rgba(248,113,113,0.22)' : 'rgba(251,191,36,0.22)'}`,
                      fontSize: 12, fontWeight: 600,
                      color: isExpired ? '#F87171' : '#FCD34D',
                    }}
                  >
                    <Clock size={13} />
                    {isExpired ? `Expired on ${expiryDate}` : `Valid until ${expiryDate}`}
                  </div>
                </div>
              )}
            </div>

            {/* ── Skills & Knowledge ──────────────────────────────────── */}
            {skills.length > 0 && (
              <div
                style={{
                  background: 'var(--ct-surface)',
                  border: '1px solid var(--ct-border)',
                  borderRadius: 14,
                  padding: 24,
                }}
              >
                <SectionLabel>Skills &amp; Knowledge</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                  {skills.map(skill => (
                    <span
                      key={skill}
                      style={{
                        fontSize: 12, fontWeight: 600,
                        background: 'rgba(37,99,235,0.10)',
                        border: '1px solid rgba(37,99,235,0.22)',
                        color: '#93C5FD',
                        borderRadius: 7,
                        padding: '5px 13px',
                        letterSpacing: '0.01em',
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── About the Event ─────────────────────────────────────── */}
            {event.description && (
              <div
                style={{
                  background: 'var(--ct-surface)',
                  border: '1px solid var(--ct-border)',
                  borderRadius: 14,
                  padding: 24,
                }}
              >
                <SectionLabel>About the Event</SectionLabel>
                <p
                  style={{
                    fontSize: 14,
                    color: 'var(--ct-text-2)',
                    lineHeight: 1.75,
                    margin: '12px 0 0',
                  }}
                >
                  {event.description}
                </p>
              </div>
            )}

            {/* ── Share + organizer ───────────────────────────────────── */}
            <ShareActions
              certId={cert.certId}
              participantName={cert.participantName}
              eventName={event.eventName}
              organizerName={organizer.orgName}
              organizerSocialLink={organizer.socialLink}
            />
          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid var(--ct-border)',
          padding: '22px 28px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 12, color: 'var(--ct-text-3)', margin: 0 }}>
          Issued and cryptographically verified by{' '}
          <span style={{ color: 'var(--ct-blue)', fontWeight: 700 }}>Certhora</span>
          {' '}· certhora.com
        </p>
      </footer>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 11, fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--ct-text-2)',
        margin: 0,
      }}
    >
      {children}
    </p>
  )
}

function MetaItem({
  icon,
  label,
  value,
  mono,
}: {
  icon?: React.ReactNode
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <p
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 11, fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ct-text-3)',
          margin: '0 0 5px',
        }}
      >
        {icon && <span style={{ opacity: 0.7 }}>{icon}</span>}
        {label}
      </p>
      <p
        style={{
          fontSize: 14, fontWeight: 600,
          color: 'var(--ct-text)',
          fontFamily: mono ? 'var(--font-geist-mono)' : undefined,
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        {value}
      </p>
    </div>
  )
}

