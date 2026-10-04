"use client"

import { useEffect, useRef, useState, type MouseEvent } from "react"
import { Archive, ArchiveRestore, MoreHorizontal, Trash2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Props {
  eventCode: string
  eventName: string
  archived: boolean
  restoreStatus: "DRAFT" | "ACTIVE"
  certificateCount: number
}

const iconBtn = {
  flexShrink: 0, width: 32, height: 32, borderRadius: 7,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "var(--ct-surface-2)", border: "1px solid var(--ct-border)",
  cursor: "pointer", color: "var(--ct-text-3)", padding: 0,
} as const

// Lives inside a clickable card (a <Link>), so every click is kept from navigating.
const swallow = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
}

export function EventCardActions({ eventCode, eventName, archived, restoreStatus, certificateCount }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<"archive" | "delete" | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: globalThis.MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [menuOpen])

  const setStatus = async (e: MouseEvent) => {
    swallow(e)
    if (busy) return
    const status = archived ? restoreStatus : "ARCHIVED"
    setBusy("archive")
    try {
      const res = await fetch(`/api/events/${eventCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Could not update the event")
      toast.success(archived ? "Event restored." : "Event archived. Find it under the Archived tab.")
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const canDelete = certificateCount === 0

  const handleDelete = async (e: MouseEvent) => {
    swallow(e)
    if (!canDelete || busy) return
    const ok = window.confirm(
      `Delete "${eventName}"?\n\nThis permanently removes the event and its design. It can't be undone.`
    )
    if (!ok) return
    setBusy("delete")
    try {
      const res = await fetch(`/api/events/${eventCode}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Could not delete the event")
      toast.success("Event deleted.")
      setMenuOpen(false)
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div ref={wrapRef} style={{ display: "flex", gap: 8, position: "relative", flexShrink: 0 }} onClick={swallow}>
      <button
        type="button"
        onClick={setStatus}
        disabled={busy !== null}
        title={
          archived
            ? "Restore: move this event back to your main list."
            : "Archive: hide this event from your main list. Certificate links keep working and you can restore it any time."
        }
        aria-label={archived ? "Restore event" : "Archive event"}
        style={{ ...iconBtn, opacity: busy ? 0.6 : 1, cursor: busy ? "wait" : "pointer" }}
      >
        {busy === "archive" ? <Loader2 size={13} className="animate-spin" /> : archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
      </button>

      <button
        type="button"
        onClick={e => { swallow(e); setMenuOpen(v => !v) }}
        title="More actions"
        aria-label="More actions"
        aria-expanded={menuOpen}
        style={{ ...iconBtn, color: menuOpen ? "var(--ct-text)" : "var(--ct-text-3)" }}
      >
        <MoreHorizontal size={14} />
      </button>

      {menuOpen && (
        <div
          role="menu"
          style={{
            position: "absolute", top: 38, right: 0, zIndex: 50, width: 280,
            padding: 12, borderRadius: 10,
            background: "var(--ct-surface-2)", border: "1px solid var(--ct-border-md)",
            boxShadow: "0 10px 28px rgba(0,0,0,0.4)", cursor: "default",
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ct-text)", margin: "0 0 4px" }}>
            How to delete an event
          </p>
          <p style={{ fontSize: 11.5, lineHeight: 1.55, color: "var(--ct-text-2)", margin: "0 0 10px" }}>
            You can only delete an event that has no certificates yet, for example one created by mistake.
            Once certificates exist their links are already in use, so use <strong>Archive</strong> instead.
            {" "}
            {canDelete
              ? "This event has no certificates, so you can delete it."
              : `This event has ${certificateCount.toLocaleString()} certificate${certificateCount === 1 ? "" : "s"}, so it can only be archived.`}
          </p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete || busy !== null}
            style={{
              width: "100%", height: 32, borderRadius: 7,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              fontSize: 12, fontWeight: 600,
              background: "transparent",
              border: `1px solid ${canDelete ? "var(--ct-error-border)" : "var(--ct-border)"}`,
              color: canDelete ? "var(--ct-error)" : "var(--ct-text-3)",
              opacity: !canDelete || busy ? 0.55 : 1,
              cursor: !canDelete ? "not-allowed" : busy ? "wait" : "pointer",
            }}
          >
            {busy === "delete" ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Delete event
          </button>
        </div>
      )}
    </div>
  )
}
