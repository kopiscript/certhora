export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CalendarDays, Award, TrendingUp, Zap } from "lucide-react"
import { QuickActions } from "@/components/quick-actions"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
    include: { _count: { select: { events: true } } },
  })

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalCerts, monthCerts] = organizer
    ? await Promise.all([
        prisma.certificate.count({
          where: { event: { organizerCd: organizer.organizerCd } },
        }),
        prisma.certificate.count({
          where: {
            event: { organizerCd: organizer.organizerCd },
            createdAt: { gte: monthStart },
          },
        }),
      ])
    : [0, 0]

  const quota = organizer?.certQuota ?? 30
  const quotaUsedPct = quota > 0 ? Math.min(100, Math.round((monthCerts / quota) * 100)) : 0

  const STATS = [
    {
      label: "Total Events",
      value: organizer?._count.events ?? 0,
      icon: CalendarDays,
      note: "All time",
    },
    {
      label: "Certificates Issued",
      value: totalCerts,
      icon: Award,
      note: "All time",
    },
    {
      label: "Used This Month",
      value: monthCerts,
      icon: TrendingUp,
      note: `of ${quota} quota`,
    },
    {
      label: "Quota Remaining",
      value: Math.max(0, quota - monthCerts),
      icon: Zap,
      note: "Resets next month",
    },
  ]

  return (
    <div className="flex flex-col flex-1">
      {/* Top bar */}
      <header
        className="h-16 flex items-center px-8 border-b shrink-0"
        style={{ borderColor: "var(--ct-border)" }}
      >
        <div>
          <h1 className="text-sm font-semibold text-foreground">Dashboard</h1>
          <p className="text-xs" style={{ color: "var(--ct-text-3)" }}>
            {now.toLocaleDateString("en-MY", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-8 space-y-8">

        {/* Welcome */}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Welcome back, <span style={{ color: "var(--ct-blue)" }}>{organizer?.orgName ?? session.user.email}</span>
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--ct-text-2)" }}>
            Here&apos;s an overview of your account.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATS.map(({ label, value, icon: Icon, note }) => (
            <div
              key={label}
              className="rounded-xl p-5 border flex flex-col gap-4"
              style={{ background: "var(--card)", borderColor: "var(--ct-border)" }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--ct-text-3)" }}>
                  {label}
                </p>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "var(--ct-blue-dim)" }}
                >
                  <Icon size={14} style={{ color: "#3B82F6" }} />
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight text-foreground">{value.toLocaleString()}</p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--ct-text-3)" }}>{note}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quota bar */}
        <div
          className="rounded-xl p-5 border"
          style={{ background: "var(--card)", borderColor: "var(--ct-border)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-foreground">Monthly Quota Usage</p>
            <span className="text-xs" style={{ color: "var(--ct-text-2)" }}>
              {monthCerts} / {quota} certificates
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: "var(--ct-surface-2)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${quotaUsedPct}%`,
                background: quotaUsedPct >= 90 ? "var(--ct-error)" : "var(--ct-blue)",
              }}
            />
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--ct-text-3)" }}>
            {quotaUsedPct}% used &mdash; resets on the 1st of next month
          </p>
        </div>

        {/* Quick actions */}
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "var(--ct-text-3)" }}>
            Quick Actions
          </p>
          <QuickActions />
        </div>

      </div>
    </div>
  )
}
