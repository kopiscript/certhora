"use client"

import { useState, type CSSProperties } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Props {
  eventCode: string
  ids?: string[]
  count: number
  label?: string
  title?: string
  iconOnly?: boolean
  style?: CSSProperties
}

export function RegenerateButton({ eventCode, ids, count, label = "Regenerate", title, iconOnly = false, style }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading || count === 0) return
    const ok = window.confirm(
      `Redraw ${count} certificate${count === 1 ? "" : "s"} with the current design?\n\n` +
      "Their links stay the same, no emails are sent, and your monthly quota is not used. " +
      "The old images are replaced."
    )
    if (!ok) return

    setLoading(true)
    const toastId = toast.loading("Regenerating certificates…")
    let done = 0
    let failed = 0
    try {
      let from: number | null = 0
      while (from !== null) {
        const res: Response = await fetch(`/api/events/${eventCode}/regenerate-certificates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, from }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Could not regenerate certificates")
        done += data.processed
        failed += data.failed
        toast.loading(`Regenerating certificates… ${done + failed} of ${data.total}`, { id: toastId })
        from = data.next
      }
      if (failed > 0) {
        toast.warning(`${done} regenerated, ${failed} failed. Try again for the ones that failed.`, { id: toastId })
      } else {
        toast.success(`${done} certificate${done === 1 ? "" : "s"} regenerated with the current design.`, { id: toastId })
      }
      router.refresh()
    } catch (err) {
      toast.error(
        `${(err as Error).message}${done > 0 ? ` (${done} were already regenerated.)` : ""}`,
        { id: toastId }
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || count === 0}
      title={title ?? label}
      aria-label={label}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
        cursor: loading ? "wait" : count === 0 ? "not-allowed" : "pointer",
        opacity: loading || count === 0 ? 0.6 : 1,
        ...style,
      }}
    >
      {loading ? <Loader2 size={iconOnly ? 15 : 13} className="animate-spin" /> : <RefreshCw size={iconOnly ? 15 : 13} />}
      {iconOnly ? null : loading ? "Regenerating…" : label}
    </button>
  )
}
