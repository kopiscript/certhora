"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

const NAV = [
  { label: "Dashboard",    href: "/dashboard",              icon: LayoutDashboard },
  { label: "Events",       href: "/dashboard/events",       icon: CalendarDays },
  { label: "Participants", href: "/dashboard/participants", icon: Users },
  { label: "Billing",   href: "/dashboard/billing",   icon: CreditCard },
  { label: "Settings",  href: "/dashboard/settings",  icon: Settings },
]

interface AppSidebarProps {
  orgName: string
  email: string
  tier: string
}

export function AppSidebar({ orgName, email, tier }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className="flex flex-col w-56 shrink-0 border-r h-screen sticky top-0"
      style={{ background: "var(--card)", borderColor: "var(--ct-border)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b shrink-0" style={{ borderColor: "var(--ct-border)" }}>
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-xs">C</span>
        </div>
        <span className="text-foreground font-semibold tracking-tight text-sm">Certhora</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{
                background: active ? "var(--ct-blue-dim)" : "transparent",
                color: active ? "#93C5FD" : "var(--ct-text-2)",
                borderLeft: active ? "2px solid var(--ct-blue)" : "2px solid transparent",
              }}
            >
              <Icon size={15} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom user info */}
      <div className="px-4 py-4 border-t space-y-3" style={{ borderColor: "var(--ct-border)" }}>
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground truncate">{orgName}</p>
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 uppercase tracking-wide shrink-0"
              style={{ background: "var(--ct-blue-dim)", color: "#93C5FD", border: "none" }}
            >
              {tier}
            </Badge>
          </div>
          <p className="text-xs truncate" style={{ color: "var(--ct-text-3)" }}>{email}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-colors"
          style={{ color: "var(--ct-text-3)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--ct-error)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--ct-text-3)")}
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
