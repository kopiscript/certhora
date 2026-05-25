"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function DeleteTemplateButton({
  templateId,
  usedInEvents,
}: {
  templateId: string
  usedInEvents: number
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (usedInEvents > 0) {
      alert(`This template is used in ${usedInEvents} event(s). Remove it from all events first.`)
      return
    }
    if (!confirm("Delete this template? This cannot be undone.")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/templates/${templateId}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
      router.refresh()
    } catch (err) {
      alert(`Delete failed: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      style={{
        height: 32, width: 32, flexShrink: 0,
        background: "var(--ct-error-bg)", border: "1px solid var(--ct-error-border)",
        borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
        cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
      }}
    >
      <Trash2 size={13} style={{ color: "var(--ct-error)" }} />
    </button>
  )
}
