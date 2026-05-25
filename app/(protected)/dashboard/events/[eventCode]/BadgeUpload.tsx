"use client"

import { useState } from "react"
import { Upload, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function BadgeUpload({
  eventCode,
  currentBadgeUrl,
}: {
  eventCode: string
  currentBadgeUrl: string | null
}) {
  const router = useRouter()
  const [preview, setPreview] = useState<string | null>(currentBadgeUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    setError("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch(`/api/events/${eventCode}/badge-upload`, { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPreview(data.url)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
      setPreview(currentBadgeUrl)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{
      background: "var(--ct-surface)", border: "1px solid var(--ct-border)",
      borderRadius: 10, padding: "16px 18px",
    }}>
      <p style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
        textTransform: "uppercase", color: "var(--ct-text-2)", marginBottom: 14,
      }}>
        Digital Badge
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="badge"
            style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover",
              border: "2px solid rgba(37,99,235,0.30)" }} />
        ) : (
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "var(--ct-blue-dim)", border: "2px dashed rgba(37,99,235,0.30)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
          }}>
            🎖
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            height: 34, padding: "0 14px",
            background: "var(--ct-surface-2)", border: "1px solid var(--ct-border)",
            borderRadius: 7, fontSize: 12, color: "var(--ct-text-2)",
            cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.6 : 1,
          }}>
            <Upload size={13} />
            {uploading ? "Uploading…" : preview ? "Replace badge" : "Upload badge"}
            <input type="file" accept="image/png,image/jpeg,image/webp"
              style={{ display: "none" }} onChange={handleFile} disabled={uploading} />
          </label>

          <p style={{ fontSize: 11, color: "var(--ct-text-3)" }}>
            {preview
              ? "Badge is shown on each participant's certificate page."
              : "Upload a PNG, JPEG or WebP image (max 5 MB)."}
          </p>

          {error && (
            <p style={{ fontSize: 11, color: "var(--ct-error)" }}>{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
