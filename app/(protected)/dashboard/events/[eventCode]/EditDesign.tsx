"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Loader2, Check, X } from "lucide-react"
import { TemplateEditor, type TemplateLayout, DEFAULT_LAYOUT, type AdditionalPlaceholder } from "@/components/template-editor/TemplateEditor"

interface TemplateData {
  eventCode: string
  imageUrl: string | null
  primaryColor: string
  nameCenterX: number
  nameY: number
  nameMaxWidth: number
  nameFontSize: number
  nameFont: string
  nameColor: string
  qrX: number
  qrY: number
  qrSize: number
  certIdFont: string
  certIdColor: string
  showWatermark: boolean
  // Prisma returns Json as unknown — cast at point of use
  additional: unknown
}

interface Props {
  eventCode: string
  template: TemplateData | null
}

export function EditDesign({ eventCode, template }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const initialLayout: TemplateLayout = {
    nameCenterX:  template?.nameCenterX  ?? DEFAULT_LAYOUT.nameCenterX,
    nameY:        template?.nameY        ?? DEFAULT_LAYOUT.nameY,
    nameMaxWidth: template?.nameMaxWidth ?? DEFAULT_LAYOUT.nameMaxWidth,
    nameFontSize: template?.nameFontSize ?? DEFAULT_LAYOUT.nameFontSize,
    nameFont:     template?.nameFont     ?? DEFAULT_LAYOUT.nameFont,
    nameColor:    template?.nameColor    ?? DEFAULT_LAYOUT.nameColor,
    qrX:          template?.qrX         ?? DEFAULT_LAYOUT.qrX,
    qrY:          template?.qrY         ?? DEFAULT_LAYOUT.qrY,
    qrSize:       template?.qrSize       ?? DEFAULT_LAYOUT.qrSize,
    certIdFont:   template?.certIdFont   ?? DEFAULT_LAYOUT.certIdFont,
    certIdColor:  template?.certIdColor  ?? DEFAULT_LAYOUT.certIdColor,
    showWatermark: template?.showWatermark ?? DEFAULT_LAYOUT.showWatermark,
    primaryColor: template?.primaryColor ?? DEFAULT_LAYOUT.primaryColor,
    additional:   (template?.additional as AdditionalPlaceholder[] | null) ?? [],
  }

  const [layout, setLayout] = useState<TemplateLayout>(initialLayout)
  const [imageUrl, setImageUrl] = useState<string | null>(template?.imageUrl ?? null)

  const handleChange = useCallback((l: TemplateLayout, img: string | null) => {
    setLayout(l)
    setImageUrl(img)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/events/${eventCode}/template`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...layout, imageUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            height: 34, padding: "0 14px",
            background: "var(--ct-surface-2)", border: "1px solid var(--ct-border)",
            borderRadius: 7, fontSize: 12, color: "var(--ct-text-2)", cursor: "pointer",
          }}
        >
          <Pencil size={13} />
          Edit Design
        </button>
      ) : (
        <div style={{
          background: "var(--ct-surface)", border: "1px solid var(--ct-border)",
          borderRadius: 14, padding: 24, marginTop: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
              textTransform: "uppercase", color: "var(--ct-text-2)",
            }}>
              Certificate Design
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {error && (
                <p style={{ fontSize: 12, color: "var(--ct-error)", alignSelf: "center" }}>{error}</p>
              )}
              <button
                onClick={() => { setOpen(false); setError("") }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  height: 34, padding: "0 14px",
                  background: "var(--ct-surface-2)", border: "1px solid var(--ct-border)",
                  borderRadius: 7, fontSize: 12, color: "var(--ct-text-2)", cursor: "pointer",
                }}
              >
                <X size={13} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  height: 34, padding: "0 14px",
                  background: "var(--ct-blue)", border: "none",
                  borderRadius: 7, fontSize: 12, color: "white", cursor: "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Check size={13} /> Save Design</>}
              </button>
            </div>
          </div>

          <TemplateEditor
            initial={layout}
            initialImageUrl={imageUrl ?? undefined}
            onChange={handleChange}
          />
        </div>
      )}
    </div>
  )
}
