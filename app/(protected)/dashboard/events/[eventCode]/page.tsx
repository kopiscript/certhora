import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, CalendarDays, LayoutTemplate, Users } from "lucide-react"
import { GenerateButton } from "./GenerateButton"

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
      template: true,
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
  const pendingCount = event.certificates.filter(c => c.emailStatus === "PENDING").length
  const sentCount = event.certificates.filter(c => c.emailStatus === "SENT").length
  const queuedCount = event.certificates.filter(c => c.emailStatus === "QUEUED").length

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
            value={event.template?.name ?? "Procedural"}
          />
          <InfoCard
            icon={<Users size={14} />}
            label="Participants"
            value={`${event._count.certificates}`}
            sub={`${pendingCount} pending · ${queuedCount} queued · ${sentCount} sent`}
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
                {event.certificates.map(c => (
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
