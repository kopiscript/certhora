"use client"

import { useRouter } from "next/navigation"
import { Copy } from "lucide-react"

export function DuplicateEventButton({ eventCode }: { eventCode: string }) {
  const router = useRouter()
  return (
    <button
      title="Duplicate event"
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
        router.push(`/dashboard/events/new?duplicateFrom=${eventCode}`)
      }}
      style={{
        flexShrink: 0, width: 32, height: 32, borderRadius: 7,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--ct-surface-2)", border: "1px solid var(--ct-border)",
        cursor: "pointer",
      }}
    >
      <Copy size={13} style={{ color: "var(--ct-text-3)" }} />
    </button>
  )
}
