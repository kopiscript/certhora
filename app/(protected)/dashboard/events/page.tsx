export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentSession, getCurrentOrganizer } from "@/lib/session"
import Link from "next/link"
import { Plus, CalendarDays, Users, Clock, FileText } from "lucide-react"
import { InfoTip } from "@/components/info-tip"
import { DuplicateEventButton } from "./DuplicateEventButton"
import { EventCardActions } from "./EventCardActions"

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT:     { label: "Draft",     bg: "rgba(148,163,184,0.12)", color: "#94A3B8" },
  ACTIVE:    { label: "Active",    bg: "rgba(34,197,94,0.10)",   color: "#22C55E" },
  COMPLETED: { label: "Completed", bg: "rgba(37,99,235,0.12)",   color: "#60A5FA" },
  ARCHIVED:  { label: "Archived",  bg: "rgba(148,163,184,0.08)", color: "#64748B" },
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>
}) {
  const session = await getCurrentSession()
  if (!session) redirect("/login")

  const organizer = await getCurrentOrganizer(session.user.id)
  if (!organizer) redirect("/login")

  const events = await prisma.event.findMany({
    where: { organizerCd: organizer.organizerCd },
    orderBy: { createdAt: "desc" },
    include: {
      template: { select: { primaryColor: true, imageUrl: true } },
      _count: { select: { certificates: true } },
    },
  })

  const { show } = await searchParams
  const showArchived = show === "archived"
  const archivedCount = events.filter((e: typeof events[number]) => e.status === "ARCHIVED").length
  const activeCount = events.length - archivedCount
  const visibleEvents = events.filter((e: typeof events[number]) => (e.status === "ARCHIVED") === showArchived)

  const fmt = (d: Date | null) =>
    d ? new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "short", year: "numeric" }).format(d) : "—"

  return (
    <div className="flex flex-col flex-1">
      <header className="h-16 flex items-center justify-between px-8 border-b shrink-0"
        style={{ borderColor: "var(--ct-border)" }}>
        <div>
          <h1 className="text-sm font-semibold flex items-center gap-1.5">
            Events
            <InfoTip>
              How it works: create an event, design the certificate, add participants (one by one or from a CSV file),
              then click Send Emails on the event page. Certificates are generated and sent in one step, so you don&apos;t need to generate first.
            </InfoTip>
          </h1>
          <p className="text-xs" style={{ color: "var(--ct-text-3)" }}>
            {visibleEvents.length} {showArchived ? "archived " : ""}event{visibleEvents.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/dashboard/events/new">
          <button style={{
            display: "flex", alignItems: "center", gap: 7,
            height: 36, padding: "0 14px", background: "var(--ct-blue)",
            color: "white", border: "none", borderRadius: 8,
            fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}>
            <Plus size={14} />
            New Event
          </button>
        </Link>
      </header>

      <div className="flex-1 p-8">
        {archivedCount > 0 || showArchived ? (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[
              { label: `Active (${activeCount})`, href: "/dashboard/events", on: !showArchived },
              { label: `Archived (${archivedCount})`, href: "/dashboard/events?show=archived", on: showArchived },
            ].map(t => (
              <Link key={t.label} href={t.href} style={{
                padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, textDecoration: "none",
                background: t.on ? "var(--ct-blue-dim)" : "transparent",
                border: `1px solid ${t.on ? "rgba(37,99,235,0.35)" : "var(--ct-border)"}`,
                color: t.on ? "#93C5FD" : "var(--ct-text-2)",
              }}>
                {t.label}
              </Link>
            ))}
          </div>
        ) : null}

        {visibleEvents.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", height: 300, gap: 12,
          }}>
            <CalendarDays size={32} style={{ color: "var(--ct-text-3)" }} />
            <p style={{ color: "var(--ct-text-2)", fontSize: 14 }}>
              {showArchived ? "No archived events" : "No events yet"}
            </p>
            {showArchived ? null : <Link href="/dashboard/events/new">
              <button style={{
                padding: "8px 16px", background: "var(--ct-blue)", color: "white",
                border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer",
              }}>
                Create your first event
              </button>
            </Link>}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {visibleEvents.map((ev: typeof events[number]) => {
              const badge = STATUS_BADGE[ev.status] ?? STATUS_BADGE.DRAFT
              return (
                <Link key={ev.eventCode} href={`/dashboard/events/${ev.eventCode}`}
                  style={{ textDecoration: "none" }}>
                  <div className="event-card-row">
                    {/* Color dot */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: ev.template?.primaryColor
                        ? `${ev.template.primaryColor}22`
                        : "var(--ct-blue-dim)",
                      border: `1px solid ${ev.template?.primaryColor ?? "#2563EB"}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <CalendarDays size={16} style={{ color: ev.template?.primaryColor ?? "#3B82F6" }} />
                    </div>

                    {/* Main info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ct-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ev.eventName}
                        </p>
                        <span style={{
                          fontSize: 10, fontWeight: 600, letterSpacing: "0.05em",
                          padding: "2px 7px", borderRadius: 5,
                          background: badge.bg, color: badge.color,
                        }}>
                          {badge.label}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--ct-text-3)" }}>
                        <span style={{ fontFamily: "monospace" }}>{ev.eventCode}</span>
                        {ev.eventDate && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Clock size={11} />{fmt(ev.eventDate)}
                          </span>
                        )}
                        {ev.template?.imageUrl && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <FileText size={11} />Custom design
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Participant count */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                        <Users size={13} style={{ color: "var(--ct-text-3)" }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ct-text)" }}>
                          {ev._count.certificates}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: "var(--ct-text-3)", marginTop: 2 }}>participants</p>
                    </div>

                    {/* Duplicate */}
                    <DuplicateEventButton eventCode={ev.eventCode} />
                    <EventCardActions
                      eventCode={ev.eventCode}
                      eventName={ev.eventName}
                      archived={ev.status === "ARCHIVED"}
                      restoreStatus={ev.issuedDate ? "ACTIVE" : "DRAFT"}
                      certificateCount={ev._count.certificates}
                    />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
