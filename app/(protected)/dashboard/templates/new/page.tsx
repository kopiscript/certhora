"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { TemplateEditor, DEFAULT_LAYOUT, type TemplateLayout } from "@/components/template-editor/TemplateEditor"
import { Loader2, Save } from "lucide-react"

export default function NewTemplatePage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [layout, setLayout] = useState<TemplateLayout>(DEFAULT_LAYOUT)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleEditorChange = useCallback((l: TemplateLayout, img: string | null) => {
    setLayout(l)
    setImageUrl(img)
  }, [])

  const handleSave = async () => {
    if (!name.trim()) { setError("Template name is required"); return }
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, imageUrl, ...layout }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push("/dashboard/templates")
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="h-16 flex items-center justify-between px-8 border-b shrink-0"
        style={{ borderColor: "var(--ct-border)" }}>
        <div>
          <h1 className="text-sm font-semibold">New Template</h1>
          <p className="text-xs" style={{ color: "var(--ct-text-3)" }}>
            Drag the name and QR elements to position them
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            height: 36, padding: "0 14px", background: "var(--ct-blue)",
            color: "white", border: "none", borderRadius: 8,
            fontSize: 13, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Template
        </button>
      </header>

      <div className="flex-1 p-8 overflow-auto">
        {/* Template name */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: "block", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.06em", textTransform: "uppercase",
            color: "var(--ct-text-2)", marginBottom: 6,
          }}>
            Template Name
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Workshop Blue, Conference 2025"
            style={{
              width: 360, height: 40,
              background: "var(--ct-surface-2)", border: "1px solid var(--ct-border)",
              borderRadius: 8, padding: "0 12px", fontSize: 14,
              color: "var(--ct-text)", outline: "none",
            }}
          />
        </div>

        {error && (
          <p style={{
            marginBottom: 16, padding: "10px 14px",
            background: "var(--ct-error-bg)", border: "1px solid var(--ct-error-border)",
            borderRadius: 8, fontSize: 13, color: "var(--ct-error)",
          }}>
            {error}
          </p>
        )}

        <TemplateEditor onChange={handleEditorChange} />
      </div>
    </div>
  )
}
