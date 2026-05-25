"use client"

import { useState } from "react"
import { Loader2, Zap, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export function GenerateButton({
  eventCode,
  pendingCount,
  quotaRemaining,
}: {
  eventCode: string
  pendingCount: number
  quotaRemaining: number
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  const disabled = pendingCount === 0 || pendingCount > quotaRemaining || loading

  const handleGenerate = async () => {
    if (disabled) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/events/${eventCode}/generate-certificates`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDone(true)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 6, padding: "0 14px",
        height: 36, background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.25)",
        borderRadius: 8, fontSize: 13, color: "#22C55E",
      }}>
        <CheckCircle size={14} /> Generated!
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <button onClick={handleGenerate} disabled={disabled} style={{
        display: "flex", alignItems: "center", gap: 7,
        height: 36, padding: "0 14px", background: disabled ? "var(--ct-surface)" : "var(--ct-blue)",
        color: disabled ? "var(--ct-text-3)" : "white",
        border: disabled ? "1px solid var(--ct-border)" : "none",
        borderRadius: 8, fontSize: 13, fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
      }}>
        {loading
          ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
          : <><Zap size={14} /> Generate Certificates ({pendingCount})</>}
      </button>
      {error && (
        <p style={{ fontSize: 11, color: "var(--ct-error)", maxWidth: 280, textAlign: "right" }}>{error}</p>
      )}
    </div>
  )
}
