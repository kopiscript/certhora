"use client"

import { useEffect, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { Menu } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"

interface Props {
  orgName: string
  email: string
  tier: string
  children: ReactNode
}

// Wraps the logged-in pages. From the md breakpoint up it renders exactly the
// original fixed sidebar + content. Below it the sidebar becomes a slide-out
// menu opened from a slim top bar, so pages get the full phone width.
export function DashboardShell({ orgName, email, tier, children }: Props) {
  const pathname = usePathname()
  // The menu is "open for" a specific page, so navigating anywhere closes it
  // without needing an effect.
  const [openFor, setOpenFor] = useState<string | null>(null)
  const open = openFor === pathname

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenFor(null)
    }
    document.addEventListener("keydown", onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        orgName={orgName}
        email={email}
        tier={tier}
        open={open}
        onNavigate={() => setOpenFor(null)}
      />

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden print:hidden"
          onClick={() => setOpenFor(null)}
          aria-hidden="true"
        />
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <div
          className="md:hidden print:hidden sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b px-3"
          style={{ background: "var(--card)", borderColor: "var(--ct-border)" }}
        >
          <button
            type="button"
            onClick={() => setOpenFor(pathname)}
            aria-label="Open menu"
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ color: "var(--ct-text-2)", border: "1px solid var(--ct-border)" }}
          >
            <Menu size={18} />
          </button>
          <Image src="/certhoralogo.svg" alt="" width={24} height={24} className="h-6 w-6 shrink-0" />
          <span className="text-sm font-semibold tracking-tight text-foreground">Certhora</span>
        </div>
        {children}
      </main>
    </div>
  )
}
