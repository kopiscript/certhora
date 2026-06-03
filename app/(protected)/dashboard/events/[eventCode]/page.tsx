export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, CalendarDays, LayoutTemplate, Users, Star, MessageSquare } from "lucide-react"
import { GenerateButton } from "./GenerateButton"
import { BadgeUpload } from "./BadgeUpload"
import { EditDesign } from "./EditDesign"

interface Props { params: Promise<{ eventCode: string }> }

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT:     { label: "Draft",     bg: "rgba(148,163,184,0.12)", color: "#94A3B8" },
  ACTIVE:    { label: "Active",    bg: "rgba(34,197,94,0.10)",   color: "#22C55E" },
  COMPLETED: { label: "Completed", bg: "rgba(37,99,235,0.12)",   color: "#60A5FA" },
  ARCHIVED:  { label: "Archived",  bg: "rgba(148,163,184,0.08)", color: "#64748B" },
}

const EMAIL_STATUS_COLORS: Record<string, string> = {
  PENDING: "#94A3B8", QUEUED: "#FBBF24", SENT: "#22C55E", FAILED: "#F87171", BOUNCED: "#F87171",
}

export default async function EventDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const { eventCode } = await params

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
    select: { organizerCd: true, certQuota: true },
  })
  if (!organizer) redirect("/login")

  const event = await prisma.event.findUnique({
    where: { eventCode },
    include: {
      template: true,   // 1-to-1 by eventCode
      certificates: {
        orderBy: { createdAt: "asc" },
        select: {
          certId: true, participantName: true, participantEmail: true,
          emailStatus: true, createdAt: true, viewCount: true,
        },
      },
      _count: { select: { certificates: true } },
    },
  })
  if (!event || event.organizerCd !== organizer.organizerCd) notFound()

  const fmt = (d: Date | null) =>
    d ? new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "short", year: "numeric" }).format(d) : "—"

  const badge = STATUS_BADGE[event.status] ?? STATUS_BADGE.DRAFT
  const pendingCount = event.certificates.filter((c: typeof event.certificates[number]) => c.emailStatus === "PENDING").length
  const sentCount = event.certificates.filter((c: typeof event.certificates[number]) => c.emailStatus === "SENT").length
  const queuedCount = event.certificates.filter((c: typeof event.certificates[number]) => c.emailStatus === "QUEUED").length

  const feedback = await prisma.eventFeedback.findMany({
    where: { eventCode },
    orderBy: { createdAt: "desc" },
  })
  const avgScore = feedback.length
    ? feedback.reduce((s: number, f: typeof feedback[number]) => s + f.npsScore, 0) / feedback.length
    : 0

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const usedThisMonth = await prisma.certificate.count({
    where: { event: { organizerCd: organizer.organizerCd }, createdAt: { gte: monthStart }, emailStatus: { not: "PENDING" } },
  })
  const quotaRemaining = organizer.certQuota - usedThisMonth

  return (
    <div className="flex flex-col flex-1">
      <header className="h-16 flex items-center justify-between px-8 border-b shrink-0"
        style={{ borderColor: "var(--ct-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard/events">
            <button style={{
              width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
              background: "var(--ct-surface-2)", border: "1px solid var(--ct-border)",
              borderRadius: 7, cursor: "pointer",
            }}>
              <ArrowLeft size={15} style={{ color: "var(--ct-text-2)" }} />
            </button>
          </Link>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 className="text-sm font-semibold">{event.eventName}</h1>
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: "0.05em",
                padding: "2px 7px", borderRadius: 5,
                background: badge.bg, color: badge.color,
              }}>
                {badge.label}
              </span>
            </div>
            <p className="text-xs" style={{ color: "var(--ct-text-3)", fontFamily: "monospace" }}>
              {event.eventCode}
            </p>
          </div>
        </div>

        <GenerateButton
          eventCode={eventCode}
          pendingCount={pendingCount}
          quotaRemaining={quotaRemaining}
        />
      </header>

      <div className="flex-1 p-8 overflow-auto" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Info cards ─────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          <InfoCard icon={<CalendarDays size={14} />} label="Event Date" value={fmt(event.eventDate)} />
          <InfoCard icon={<CalendarDays size={14} />} label="Expires" value={fmt(event.expiryDate)} />
          <InfoCard
            icon={<LayoutTemplate size={14} />}
            label="Template"
            value={event.template?.imageUrl ? "Custom background" : "Procedural"}
          />
          <InfoCard
            icon={<Users size={14} />}
            label="Participants"
            value={`${event._count.certificates}`}
            sub={`${pendingCount} pending · ${queuedCount} queued · ${sentCount} sent`}
          />
          <InfoCard
            icon={<span style={{ fontSize: 13 }}>🎖</span>}
            label="Digital Badge"
            value={event.hasBadge ? "Enabled" : "Disabled"}
            sub={event.hasBadge ? "Badge shown on cert page" : undefined}
          />
          <InfoCard
            icon={<Star size={14} />}
            label="Feedback"
            value={feedback.length > 0 ? `${avgScore.toFixed(1)} / 5` : "No feedback yet"}
            sub={feedback.length > 0 ? `${feedback.length} response${feedback.length > 1 ? "s" : ""}` : undefined}
          />
        </div>

        {/* ── Skills ─────────────────────────────────────────────────── */}
        {event.skills && (event.skills as string[]).length > 0 && (
          <div>
            <p style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
              textTransform: "uppercase", color: "var(--ct-text-2)", marginBottom: 8,
            }}>
              Skills
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(event.skills as string[]).map(s => (
                <span key={s} style={{
                  fontSize: 12, fontWeight: 500,
                  background: "var(--ct-blue-dim)", border: "1px solid rgba(37,99,235,0.18)",
                  color: "#93C5FD", borderRadius: 6, padding: "3px 10px",
                }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Certificate design editor ────────────────────────────────── */}
        <EditDesign eventCode={eventCode} template={event.template ?? null} />

        {/* Badge upload */}
        {event.hasBadge && (
          <BadgeUpload eventCode={eventCode} currentBadgeUrl={event.badgeUrl ?? null} />
        )}

        {/* ── Quota notice ────────────────────────────────────────────── */}
        {pendingCount > 0 && pendingCount > quotaRemaining && (
          <div style={{
            padding: "10px 14px", background: "var(--ct-error-bg)",
            border: "1px solid var(--ct-error-border)", borderRadius: 8,
            fontSize: 13, color: "var(--ct-error)",
          }}>
            Quota exceeded — {quotaRemaining} remaining, {pendingCount} pending.
            Upgrade your plan to generate all certificates.
          </div>
        )}

        {/* ── Participants table ──────────────────────────────────────── */}
        <div>
          <p style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
            textTransform: "uppercase", color: "var(--ct-text-2)", marginBottom: 10,
          }}>
            Participants
          </p>
          <div style={{
            background: "var(--ct-surface)", border: "1px solid var(--ct-border)",
            borderRadius: 10, overflow: "hidden",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--ct-border)" }}>
                  {["Cert ID", "Name", "Email", "Status", "Views"].map(h => (
                    <th key={h} style={{
                      padding: "10px 14px", textAlign: "left",
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                      textTransform: "uppercase", color: "var(--ct-text-3)",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {event.certificates.map((c: typeof event.certificates[number]) => (
                  <tr key={c.certId} style={{ borderBottom: "1px solid var(--ct-border)" }}>
                    <td style={{ padding: "10px 14px" }}>
                      <Link href={`/certs/view/${c.certId}`} target="_blank"
                        style={{ fontSize: 12, fontFamily: "monospace", color: "var(--ct-blue)", textDecoration: "none" }}>
                        {c.certId}
                      </Link>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--ct-text)" }}>
                      {c.participantName}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--ct-text-2)" }}>
                      {c.participantEmail}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5,
                        background: `${EMAIL_STATUS_COLORS[c.emailStatus]}18`,
                        color: EMAIL_STATUS_COLORS[c.emailStatus],
                      }}>
                        {c.emailStatus}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--ct-text-3)" }}>
                      {c.viewCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* ── Feedback ────────────────────────────────────────────────── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <p style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
              textTransform: "uppercase", color: "var(--ct-text-2)", margin: 0,
            }}>
              Participant Feedback
            </p>
            {feedback.length > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 11, fontWeight: 600,
                background: "rgba(251,191,36,0.10)",
                border: "1px solid rgba(251,191,36,0.22)",
                color: "#FBBF24",
                borderRadius: 5, padding: "2px 8px",
              }}>
                <Star size={10} fill="#FBBF24" />
                {avgScore.toFixed(1)}
              </span>
            )}
          </div>

          {feedback.length === 0 ? (
            <div style={{
              background: "var(--ct-surface)", border: "1px solid var(--ct-border)",
              borderRadius: 10, padding: "28px 20px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            }}>
              <MessageSquare size={22} style={{ color: "var(--ct-text-3)" }} />
              <p style={{ fontSize: 13, color: "var(--ct-text-3)", margin: 0 }}>
                No feedback yet — responses will appear here once participants rate the event.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {feedback.map((f: typeof feedback[number]) => (
                <div key={f.id} style={{
                  background: "var(--ct-surface)", border: "1px solid var(--ct-border)",
                  borderRadius: 10, padding: "14px 16px",
                  display: "flex", gap: 14, alignItems: "flex-start",
                }}>
                  {/* Score badge */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 9, flexShrink: 0,
                    background: "rgba(251,191,36,0.09)",
                    border: "1px solid rgba(251,191,36,0.18)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: 1,
                  }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#FBBF24", lineHeight: 1 }}>
                      {f.npsScore}
                    </span>
                    <span style={{ fontSize: 9, color: "rgba(251,191,36,0.55)", fontWeight: 600 }}>/ 5</span>
                  </div>

                  {/* Stars + comment */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 2, marginBottom: f.comment ? 6 : 0 }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star
                          key={i}
                          size={13}
                          fill={i <= f.npsScore ? "#FBBF24" : "none"}
                          strokeWidth={1.8}
                          style={{ color: i <= f.npsScore ? "#FBBF24" : "rgba(255,255,255,0.15)" }}
                        />
                      ))}
                    </div>
                    {f.comment && (
                      <p style={{
                        fontSize: 13, color: "var(--ct-text-2)",
                        lineHeight: 1.6, margin: 0,
                      }}>
                        {f.comment}
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <span style={{ fontSize: 11, color: "var(--ct-text-3)", flexShrink: 0, paddingTop: 2 }}>
                    {new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "short" }).format(f.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function InfoCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: "var(--ct-surface)", border: "1px solid var(--ct-border)",
      borderRadius: 10, padding: "12px 14px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, color: "var(--ct-text-3)" }}>
        {icon}
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {label}
        </span>
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ct-text)" }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: "var(--ct-text-3)", marginTop: 2 }}>{sub}</p>}
    </div>
  )
}
