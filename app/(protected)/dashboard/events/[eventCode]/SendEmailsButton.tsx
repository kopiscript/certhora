"use client"

import { useState } from "react"
import { Loader2, Send, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export function SendEmailsButton({
  eventCode,
  resendableCount,
}: {
  eventCode: string
  resendableCount: number
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null)
  const [error, setError] = useState("")

  const disabled = resendableCount === 0 || loading

  const handleSend = async () => {
    if (disabled) return
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch(`/api/events/${eventCode}/send-emails`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult({ sent: data.sent, failed: data.failed })
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <button onClick={handleSend} disabled={disabled} style={{
        display: "flex", alignItems: "center", gap: 7,
        height: 36, padding: "0 14px", background: disabled ? "var(--ct-surface)" : "var(--ct-surface-2)",
        color: disabled ? "var(--ct-text-3)" : "var(--ct-text)",
        border: "1px solid var(--ct-border)",
        borderRadius: 8, fontSize: 13, fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
      }}>
        {loading
          ? <><Loader2 size={14} className="animate-spin" /> Sending…</>
          : <><Send size={14} /> Send Emails ({resendableCount})</>}
      </button>
      {result && (
        <p style={{ fontSize: 11, color: "#22C55E", display: "flex", alignItems: "center", gap: 4 }}>
          <CheckCircle size={12} /> Sent {result.sent}{result.failed > 0 ? `, ${result.failed} failed` : ""}
        </p>
      )}
      {error && (
        <p style={{ fontSize: 11, color: "var(--ct-error)", maxWidth: 280, textAlign: "right" }}>{error}</p>
      )}
    </div>
  )
}
