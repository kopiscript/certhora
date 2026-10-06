export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentSession, getCurrentOrganizer } from "@/lib/session"
import { Award, Eye, Share2, MailCheck } from "lucide-react"
import type { EmailStatus } from "@prisma/client"
import { InfoTip } from "@/components/info-tip"
import { AnalyticsEventFilter } from "@/components/analytics-event-filter"

const DAYS = 30

const STATUS_META: { status: EmailStatus; label: string; hint: string; color: string }[] = [
  { status: "SENT", label: "Delivered", hint: "Email went out", color: "#22C55E" },
  { status: "QUEUED", label: "Waiting to send", hint: "In line to be sent", color: "#3B82F6" },
  { status: "PENDING", label: "Not sent yet", hint: "Not started", color: "#A1A1AA" },
  { status: "FAILED", label: "Could not send", hint: "Something went wrong", color: "#F87171" },
  { status: "BOUNCED", label: "Email rejected", hint: "Address didn't accept it", color: "#F59E0B" },
]

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  COMPLETED: "Finished",
  ARCHIVED: "Archived",
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>
}) {
  const session = await getCurrentSession()
  if (!session) redirect("/login")

  const organizer = await getCurrentOrganizer(session.user.id)
  const orgCd = organizer?.organizerCd ?? ""

  const events = await prisma.event.findMany({
    where: { organizerCd: orgCd },
    select: { eventCode: true, eventName: true, status: true },
    orderBy: { createdAt: "desc" },
  })

  const { event: eventParam } = await searchParams
  const selected = events.some((e) => e.eventCode === eventParam) ? (eventParam as string) : ""
  const selectedEvent = events.find((e) => e.eventCode === selected)
  const where = selected
    ? { eventCode: selected, event: { organizerCd: orgCd } }
    : { event: { organizerCd: orgCd } }

  const since = new Date()
  since.setHours(0, 0, 0, 0)
  since.setDate(since.getDate() - (DAYS - 1))

  const [totals, statusGroups, recent, perEvent, perEventStatus, feedback, openedCount, sharedCount] = await Promise.all([
    prisma.certificate.aggregate({
      where,
      _count: { _all: true },
      _sum: { viewCount: true, shareCount: true },
    }),
    prisma.certificate.groupBy({ by: ["emailStatus"], where, _count: { _all: true } }),
    prisma.certificate.findMany({
      where: { ...where, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.certificate.groupBy({
      by: ["eventCode"],
      where,
      _count: { _all: true },
      _sum: { viewCount: true, shareCount: true },
    }),
    prisma.certificate.groupBy({
      by: ["eventCode", "emailStatus"],
      where,
      _count: { _all: true },
    }),
    prisma.eventFeedback.findMany({
      where: selected ? { eventCode: selected } : { event: { organizerCd: orgCd } },
      select: { eventCode: true, npsScore: true },
    }),
    prisma.certificate.count({ where: { ...where, viewCount: { gt: 0 } } }),
    prisma.certificate.count({ where: { ...where, shareCount: { gt: 0 } } }),
  ])

  const totalCerts = totals._count._all
  const views = totals._sum.viewCount ?? 0
  const shares = totals._sum.shareCount ?? 0

  const statusCount = new Map(statusGroups.map((g) => [g.emailStatus, g._count._all]))
  const sent = statusCount.get("SENT") ?? 0
  const problems = (statusCount.get("FAILED") ?? 0) + (statusCount.get("BOUNCED") ?? 0)

  const buckets = new Map<string, number>()
  for (const c of recent) {
    const k = dayKey(c.createdAt)
    buckets.set(k, (buckets.get(k) ?? 0) + 1)
  }
  const series = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(since)
    d.setDate(since.getDate() + i)
    return { date: d, count: buckets.get(dayKey(d)) ?? 0 }
  })
  const last30 = series.reduce((n, s) => n + s.count, 0)
  const last7 = series.slice(-7).reduce((n, s) => n + s.count, 0)
  const today = series[series.length - 1].count

  const eventStats = new Map(perEvent.map((g) => [g.eventCode, g]))
  const eventStatusStats = new Map<string, Map<string, number>>()
  for (const g of perEventStatus) {
    if (!eventStatusStats.has(g.eventCode)) eventStatusStats.set(g.eventCode, new Map())
    eventStatusStats.get(g.eventCode)!.set(g.emailStatus, g._count._all)
  }
  const eventScores = new Map<string, number[]>()
  for (const f of feedback) {
    if (!eventScores.has(f.eventCode)) eventScores.set(f.eventCode, [])
    eventScores.get(f.eventCode)!.push(f.npsScore)
  }

  const rows = events
    .filter((e) => !selected || e.eventCode === selected)
    .map((e) => {
      const g = eventStats.get(e.eventCode)
      const st = eventStatusStats.get(e.eventCode)
      const scores = eventScores.get(e.eventCode) ?? []
      return {
        ...e,
        certs: g?._count._all ?? 0,
        views: g?._sum.viewCount ?? 0,
        shares: g?._sum.shareCount ?? 0,
        delivered: st?.get("SENT") ?? 0,
        problems: (st?.get("FAILED") ?? 0) + (st?.get("BOUNCED") ?? 0),
        avgScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
        responses: scores.length,
      }
    })
    .sort((a, b) => b.certs - a.certs)

  const happy = feedback.filter((f) => f.npsScore >= 9).length
  const neutral = feedback.filter((f) => f.npsScore >= 7 && f.npsScore <= 8).length
  const unhappy = feedback.filter((f) => f.npsScore <= 6).length
  const avgScore = feedback.length ? feedback.reduce((a, f) => a + f.npsScore, 0) / feedback.length : null

  const KPIS = [
    {
      label: "Certificates created",
      value: totalCerts.toLocaleString(),
      lines: [`${today} today`, `${last7} in the last 7 days`, `${last30} in the last ${DAYS} days`],
      icon: Award,
    },
    {
      label: "Emails delivered",
      value: `${sent.toLocaleString()} of ${totalCerts.toLocaleString()}`,
      lines: [`${pct(sent, totalCerts)}% delivered`, `${problems.toLocaleString()} had a problem`],
      icon: MailCheck,
    },
    {
      label: "Times people viewed their certificate",
      value: views.toLocaleString(),
      lines: [totalCerts > 0 ? `About ${(views / totalCerts).toFixed(1)} views per certificate` : "No certificates yet"],
      icon: Eye,
    },
    {
      label: "Times people shared it",
      value: shares.toLocaleString(),
      lines: [totalCerts > 0 ? `${pct(shares, totalCerts)} shares for every 100 certificates` : "No certificates yet"],
      icon: Share2,
    },
  ]

  const cardStyle = { background: "var(--card)", borderColor: "var(--ct-border)" }
  const muted = { color: "var(--ct-text-3)" }
  const soft = { color: "var(--ct-text-2)" }

  const funnel = [
    { label: "Created", hint: "Certificate was made", count: totalCerts, color: "#3B82F6" },
    { label: "Email delivered", hint: "Participant was sent their certificate", count: sent, color: "#22C55E" },
    { label: "Opened", hint: "Participant looked at it at least once", count: openedCount, color: "#A855F7" },
    { label: "Shared", hint: "Participant shared it with others", count: sharedCount, color: "#F59E0B" },
  ]

  return (
    <div className="flex flex-col flex-1">
      <header
        className="min-h-16 py-2 flex flex-wrap items-center justify-between gap-3 md:gap-4 px-4 md:px-8 border-b shrink-0"
        style={{ borderColor: "var(--ct-border)" }}
      >
        <div>
          <h1 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            Analytics
            <InfoTip>
              The numbers cover all your events. Use &ldquo;Show data for&rdquo; at the top right to look at one event only.
              &ldquo;Opened&rdquo; means the participant looked at their certificate at least once.
            </InfoTip>
          </h1>
          <p className="text-xs" style={muted}>How many certificates you made, whether they arrived, and who looked at them</p>
        </div>
        <AnalyticsEventFilter events={events} selected={selected} />
      </header>

      <div className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {KPIS.map(({ label, value, lines, icon: Icon }) => (
            <div key={label} className="rounded-xl p-5 border flex flex-col gap-4" style={cardStyle}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-widest" style={muted}>{label}</p>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "var(--ct-blue-dim)" }}
                >
                  <Icon size={14} style={{ color: "#3B82F6" }} />
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
                <ul className="mt-2 space-y-0.5">
                  {lines.map((l) => (
                    <li key={l} className="text-xs" style={soft}>{l}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl p-5 border" style={cardStyle}>
          <p className="text-sm font-medium text-foreground">
            What happened to the certificates{selectedEvent ? ` in ${selectedEvent.eventName}` : ""}?
          </p>
          <p className="text-xs mt-0.5 mb-5" style={muted}>
            Step by step, from creating a certificate to a participant sharing it. The percentage is out of all certificates created.
          </p>
          {totalCerts === 0 ? (
            <p className="text-sm" style={muted}>No certificates created yet.</p>
          ) : (
            <ol className="space-y-4">
              {funnel.map((step, i) => {
                const prev = i > 0 ? funnel[i - 1].count : 0
                const lost = i > 0 ? prev - step.count : 0
                return (
                  <li key={step.label}>
                    <div className="flex justify-between items-baseline gap-4 mb-1.5">
                      <div>
                        <span className="text-sm font-medium text-foreground">{step.label}</span>
                        <span className="ml-2 text-xs" style={muted}>{step.hint}</span>
                      </div>
                      <span className="tabular-nums text-sm shrink-0 text-foreground">
                        {step.count.toLocaleString()}
                        <span className="text-xs ml-1.5" style={soft}>{pct(step.count, totalCerts)}%</span>
                      </span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--ct-surface-2)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct(step.count, totalCerts)}%`, background: step.color }} />
                    </div>
                    {i > 0 && lost > 0 && (
                      <p className="mt-1 text-xs" style={muted}>
                        {lost.toLocaleString()} fewer than the step above ({pct(lost, prev)}% dropped off)
                      </p>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="rounded-xl p-5 border xl:col-span-2" style={cardStyle}>
            <p className="text-sm font-medium text-foreground">Did the emails arrive?</p>
            <p className="text-xs mt-0.5 mb-4" style={muted}>Each certificate is emailed to the participant. Here is what happened to those emails.</p>
            {totalCerts === 0 ? (
              <p className="text-sm" style={muted}>No certificates created yet.</p>
            ) : (
              <>
                <div className="flex h-3 rounded-full overflow-hidden" style={{ background: "var(--ct-surface-2)" }}>
                  {STATUS_META.map(({ status, color }) => {
                    const n = statusCount.get(status) ?? 0
                    return n > 0 ? <div key={status} style={{ width: `${(n / totalCerts) * 100}%`, background: color }} /> : null
                  })}
                </div>
                <ul className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {STATUS_META.map(({ status, label, hint, color }) => {
                    const n = statusCount.get(status) ?? 0
                    return (
                      <li key={status} className="text-xs">
                        <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: color }} />
                        <span style={soft}>{label}</span>
                        <p className="mt-0.5 text-lg font-semibold text-foreground">{n.toLocaleString()}</p>
                        <p style={muted}>{pct(n, totalCerts)}% &middot; {hint}</p>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </div>

          <div className="rounded-xl p-5 border" style={cardStyle}>
            <p className="text-sm font-medium text-foreground">How happy were participants?</p>
            <p className="text-xs mt-0.5 mb-4" style={muted}>Based on scores from 0 to 10 that participants gave after the event.</p>
            {avgScore === null ? (
              <p className="text-sm" style={muted}>No feedback yet.</p>
            ) : (
              <>
                <p className="text-4xl font-bold tracking-tight text-foreground">
                  {avgScore.toFixed(1)}
                  <span className="text-base font-medium" style={muted}> / 10</span>
                </p>
                <p className="mt-1 text-xs" style={soft}>average from {feedback.length.toLocaleString()} replies</p>
                <ul className="mt-4 space-y-2 text-xs">
                  {[
                    { label: "Very happy (9–10)", n: happy, color: "#22C55E" },
                    { label: "Okay (7–8)", n: neutral, color: "#A1A1AA" },
                    { label: "Unhappy (0–6)", n: unhappy, color: "#F87171" },
                  ].map(({ label, n, color }) => (
                    <li key={label}>
                      <div className="flex justify-between" style={soft}>
                        <span>{label}</span>
                        <span>{n} ({pct(n, feedback.length)}%)</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--ct-surface-2)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct(n, feedback.length)}%`, background: color }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden" style={cardStyle}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--ct-border)" }}>
            <p className="text-sm font-medium text-foreground">Your events, side by side</p>
          </div>
          {rows.length === 0 ? (
            <p className="p-5 text-sm" style={muted}>No events yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-widest" style={muted}>
                    <th className="px-5 py-3 font-medium">Event</th>
                    <th className="px-5 py-3 font-medium">State</th>
                    <th className="px-5 py-3 font-medium text-right">Certificates</th>
                    <th className="px-5 py-3 font-medium text-right">Emails delivered</th>
                    <th className="px-5 py-3 font-medium text-right">Problems</th>
                    <th className="px-5 py-3 font-medium text-right">Views</th>
                    <th className="px-5 py-3 font-medium text-right">Shares</th>
                    <th className="px-5 py-3 font-medium text-right">Happiness</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.eventCode} className="border-t" style={{ borderColor: "var(--ct-border)" }}>
                      <td className="px-5 py-3">
                        <Link href={`/dashboard/events/${r.eventCode}`} className="font-medium text-foreground hover:underline">
                          {r.eventName}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-xs" style={soft}>{STATUS_LABEL[r.status] ?? r.status}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{r.certs.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {r.delivered.toLocaleString()}
                        <span className="text-xs" style={muted}> ({pct(r.delivered, r.certs)}%)</span>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums" style={r.problems > 0 ? { color: "var(--ct-error)" } : undefined}>
                        {r.problems.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">{r.views.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{r.shares.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {r.avgScore === null ? (
                          <span style={muted}>&mdash;</span>
                        ) : (
                          <>
                            {r.avgScore.toFixed(1)}
                            <span className="text-xs" style={muted}> ({r.responses})</span>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
