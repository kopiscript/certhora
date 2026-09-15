"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Loader2, Check, X, AlertCircle } from "lucide-react"
import { TemplateEditor, type TemplateLayout, DEFAULT_LAYOUT, type AdditionalPlaceholder } from "@/components/template-editor/TemplateEditor"

const AUTOSAVE_DELAY_MS = 800

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
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
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

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNextRef = useRef(true) // TemplateEditor fires onChange once on mount — don't autosave that

  const persist = useCallback(async (l: TemplateLayout, img: string | null) => {
    setStatus("saving")
    setError("")
    try {
      const res = await fetch(`/api/events/${eventCode}/template`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...l, imageUrl: img }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus("saved")
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
      setStatus("error")
    }
  }, [eventCode, router])

  const handleChange = useCallback((l: TemplateLayout, img: string | null) => {
    setLayout(l)
    setImageUrl(img)
    if (skipNextRef.current) { skipNextRef.current = false; return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => persist(l, img), AUTOSAVE_DELAY_MS)
  }, [persist])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  return (
    <div>
      {!open ? (
        <button
          onClick={() => { skipNextRef.current = true; setOpen(true) }}
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
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {status === "saving" && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ct-text-3)" }}>
                  <Loader2 size={13} className="animate-spin" /> Saving…
                </span>
              )}
              {status === "saved" && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#22C55E" }}>
                  <Check size={13} /> Saved
                </span>
              )}
              {status === "error" && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ct-error)" }}>
                  <AlertCircle size={13} /> {error || "Save failed"}
                </span>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  height: 34, padding: "0 14px",
                  background: "var(--ct-surface-2)", border: "1px solid var(--ct-border)",
                  borderRadius: 7, fontSize: 12, color: "var(--ct-text-2)", cursor: "pointer",
                }}
              >
                <X size={13} /> Done
              </button>
            </div>
          </div>

          <p style={{ fontSize: 11, color: "var(--ct-text-3)", marginBottom: 16, marginTop: -12 }}>
            Changes save automatically as you drag or edit.
          </p>

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
