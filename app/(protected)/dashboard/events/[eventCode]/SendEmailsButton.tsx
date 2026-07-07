"use client"

import { useState } from "react"
import { Loader2, Send } from "lucide-react"
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
  const [error, setError] = useState("")

  const disabled = resendableCount === 0 || loading

  const handleSend = async () => {
    if (disabled) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/events/${eventCode}/send-emails`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSend}
      disabled={disabled}
      title={error || (resendableCount === 0 ? "No sendable certificates" : undefined)}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        height: 36, padding: "0 14px",
        background: disabled ? "var(--ct-surface-2)" : "var(--ct-blue)",
        color: disabled ? "var(--ct-text-3)" : "white",
        border: "none", borderRadius: 8,
        fontSize: 13, fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {loading
        ? <><Loader2 size={14} className="animate-spin" /> Sending…</>
        : <><Send size={14} /> Send Emails ({resendableCount})</>}
    </button>
  )
}
