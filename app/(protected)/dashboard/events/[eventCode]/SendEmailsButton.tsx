"use client"

import { useState } from "react"
import { Loader2, Send } from "lucide-react"
import { useRouter } from "next/navigation"

export function SendEmailsButton({
  eventCode,
  resendableCount,
  canSendEmails,
}: {
  eventCode: string
  resendableCount: number
  canSendEmails: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ sent: 0, remaining: 0 })
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const disabled = !canSendEmails || resendableCount === 0 || loading

  const handleSend = async () => {
    if (disabled) return
    setLoading(true)
    setError("")
    setNotice("")
    let totalSent = 0
    try {
      // Each request only sends a capped batch (Vercel function time limit),
      // so keep calling until the queue is empty — the organizer only clicks once.
      for (let i = 0; i < 50; i++) {
        const res = await fetch(`/api/events/${eventCode}/send-emails`, { method: "POST" })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        if (data.sent === 0 && data.generateError) throw new Error(data.generateError)
        totalSent += data.sent
        setProgress({ sent: totalSent, remaining: data.remaining })
        if (data.dailyLimitReached) {
          setNotice(`Daily send limit reached — ${data.remaining} will send once you try again tomorrow.`)
          break
        }
        if (data.remaining === 0) break
      }
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <button
        onClick={handleSend}
        disabled={disabled}
        title={error || (!canSendEmails ? "Upgrade to Pro to email participants" : resendableCount === 0 ? "No sendable certificates" : undefined)}
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
          ? <><Loader2 size={14} className="animate-spin" /> Sending... ({progress.sent} sent{progress.remaining > 0 ? `, ${progress.remaining} left` : ""})</>
          : <><Send size={14} /> {canSendEmails ? `Send Emails (${resendableCount})` : "Pro Only: Send Emails"}</>}
      </button>
      {notice && (
        <p style={{ fontSize: 11, color: "#FBBF24", maxWidth: 280, textAlign: "right" }}>{notice}</p>
      )}
      {error && (
        <p style={{ fontSize: 11, color: "var(--ct-error)", maxWidth: 280, textAlign: "right" }}>{error}</p>
      )}
    </div>
  )
}
