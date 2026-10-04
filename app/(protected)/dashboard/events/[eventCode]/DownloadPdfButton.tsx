"use client"

import { useState, type CSSProperties } from "react"
import { Loader2, FileDown } from "lucide-react"
import { toast } from "sonner"

interface Props {
  href: string
  label?: string
  title?: string
  iconOnly?: boolean
  style?: CSSProperties
}

export function DownloadPdfButton({ href, label = "Download PDF", title, iconOnly = false, style }: Props) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    const toastId = toast.loading("Preparing your PDF… this can take up to a minute for 50 certificates.")
    try {
      const res = await fetch(href)
      if (!res.ok) {
        let message = "Could not create the PDF. Please try again."
        try {
          const data = await res.json()
          if (data?.error) message = data.error
        } catch {}
        throw new Error(message)
      }
      const blob = await res.blob()
      const match = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = match?.[1] ?? "certificates.pdf"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success("PDF downloaded. Check your Downloads folder.", { id: toastId })
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      title={title ?? label}
      aria-label={label}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
        cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1,
        ...style,
      }}
    >
      {loading ? <Loader2 size={iconOnly ? 15 : 13} className="animate-spin" /> : <FileDown size={iconOnly ? 15 : 13} />}
      {iconOnly ? null : loading ? "Preparing…" : label}
    </button>
  )
}
