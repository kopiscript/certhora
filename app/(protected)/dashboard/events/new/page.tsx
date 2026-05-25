"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ChevronRight, ChevronLeft, Plus, Upload } from "lucide-react"
import { TemplateEditor, type TemplateLayout, DEFAULT_LAYOUT } from "@/components/template-editor/TemplateEditor"

type Step = 1 | 2

export default function NewEventPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)

  // ── Step 1 — event details ────────────────────────────────────────────────
  const [eventName, setEventName] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [description, setDescription] = useState("")
  const [skillsRaw, setSkillsRaw] = useState("")
  const [hasBadge, setHasBadge] = useState(false)
  const [badgeFile, setBadgeFile] = useState<File | null>(null)
  const [badgePreview, setBadgePreview] = useState<string | null>(null)

  // ── Step 2 — certificate design ───────────────────────────────────────────
  const [templateLayout, setTemplateLayout] = useState<TemplateLayout>(DEFAULT_LAYOUT)
  const [templateImageUrl, setTemplateImageUrl] = useState<string | null>(null)

  const handleDesignChange = useCallback((layout: TemplateLayout, imageUrl: string | null) => {
    setTemplateLayout(layout)
    setTemplateImageUrl(imageUrl)
  }, [])

  // ── Submission ────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleCreate = async () => {
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: eventName.trim(),
          eventDate: eventDate || undefined,
          expiryDate: expiryDate || undefined,
          description: description.trim() || undefined,
          skills: skillsRaw.split(",").map(s => s.trim()).filter(Boolean),
          hasBadge,
          template: {
            ...templateLayout,
            imageUrl: templateImageUrl,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (hasBadge && badgeFile) {
        const fd = new FormData()
        fd.append("file", badgeFile)
        await fetch(`/api/events/${data.eventCode}/badge-upload`, { method: "POST", body: fd })
      }

      router.push(`/dashboard/events/${data.eventCode}`)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="h-16 flex items-center justify-between px-8 border-b shrink-0"
        style={{ borderColor: "var(--ct-border)" }}>
        <div>
          <h1 className="text-sm font-semibold">New Event</h1>
          <p className="text-xs" style={{ color: "var(--ct-text-3)" }}>Step {step} of 2</p>
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {([1, 2] as Step[]).map(s => (
            <div key={s} style={{
              width: 28, height: 4, borderRadius: 4,
              background: s <= step ? "var(--ct-blue)" : "var(--ct-border)",
              transition: "background 200ms",
            }} />
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-auto" style={{ padding: step === 2 ? "32px" : "32px", maxWidth: step === 2 ? "none" : 680 }}>

        {error && (
          <div style={{
            marginBottom: 20, padding: "10px 14px",
            background: "var(--ct-error-bg)", border: "1px solid var(--ct-error-border)",
            borderRadius: 8, fontSize: 13, color: "var(--ct-error)",
          }}>
            {error}
          </div>
        )}

        {/* ── Step 1: Event details ──────────────────────────────────── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Field label="Event Name *">
              <input value={eventName} onChange={e => setEventName(e.target.value)}
                placeholder="e.g. Web Development Workshop 2025"
                style={inputStyle} />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Event Date">
                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                  style={inputStyle} />
              </Field>
              <Field label="Certificate Expiry">
                <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
                  style={inputStyle} />
              </Field>
            </div>

            <Field label="Description">
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                rows={3} placeholder="Brief description of the event…"
                style={{ ...inputStyle, height: "auto", padding: "10px 12px", resize: "vertical" }} />
            </Field>

            <Field label="Skills (comma-separated)">
              <input value={skillsRaw} onChange={e => setSkillsRaw(e.target.value)}
                placeholder="React, TypeScript, Node.js"
                style={inputStyle} />
            </Field>

            <div style={{
              background: hasBadge ? "var(--ct-blue-dim)" : "var(--ct-surface-2)",
              border: `1px solid ${hasBadge ? "rgba(37,99,235,0.25)" : "var(--ct-border)"}`,
              borderRadius: 10, overflow: "hidden",
              transition: "background 150ms, border-color 150ms",
            }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", cursor: "pointer" }}>
                <input type="checkbox" checked={hasBadge} onChange={e => setHasBadge(e.target.checked)}
                  style={{ marginTop: 2, accentColor: "#2563EB", width: 16, height: 16, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ct-text)", marginBottom: 2 }}>
                    Issue Digital Badge
                  </p>
                  <p style={{ fontSize: 12, color: "var(--ct-text-2)" }}>
                    Upload your badge image — shown on each participant&apos;s certificate page.
                  </p>
                </div>
              </label>

              {hasBadge && (
                <div style={{
                  borderTop: "1px solid rgba(37,99,235,0.15)",
                  padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: 16,
                }}>
                  {badgePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={badgePreview} alt="badge preview"
                      style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(37,99,235,0.30)" }} />
                  ) : (
                    <div style={{
                      width: 72, height: 72, borderRadius: "50%",
                      background: "rgba(37,99,235,0.08)", border: "2px dashed rgba(37,99,235,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                    }}>
                      🎖
                    </div>
                  )}
                  <div>
                    <label style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      height: 34, padding: "0 14px",
                      background: "var(--ct-surface)", border: "1px solid var(--ct-border)",
                      borderRadius: 7, fontSize: 12, color: "var(--ct-text-2)", cursor: "pointer",
                    }}>
                      <Upload size={13} />
                      {badgeFile ? "Change badge" : "Upload badge image"}
                      <input type="file" accept="image/png,image/jpeg,image/webp"
                        style={{ display: "none" }}
                        onChange={e => {
                          const f = e.target.files?.[0]
                          if (!f) return
                          setBadgeFile(f)
                          setBadgePreview(URL.createObjectURL(f))
                        }} />
                    </label>
                    {badgeFile && (
                      <p style={{ fontSize: 11, color: "var(--ct-text-3)", marginTop: 5 }}>{badgeFile.name}</p>
                    )}
                    <p style={{ fontSize: 11, color: "var(--ct-text-3)", marginTop: badgeFile ? 0 : 5 }}>
                      PNG, JPEG or WebP · max 5 MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Certificate design ─────────────────────────────── */}
        {step === 2 && (
          <div>
            <p style={{ fontSize: 13, color: "var(--ct-text-2)", marginBottom: 20 }}>
              Design the certificate layout. Drag the name and QR elements to position them.
              Add custom text placeholders for dates, location, or any other fields.
            </p>
            <TemplateEditor
              initial={templateLayout}
              initialImageUrl={templateImageUrl ?? undefined}
              onChange={handleDesignChange}
            />
          </div>
        )}

        {/* ── Navigation ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
          {step > 1 ? (
            <button onClick={() => setStep(s => (s - 1) as Step)} style={btnSecondary}>
              <ChevronLeft size={15} /> Back
            </button>
          ) : (
            <div />
          )}
          {step < 2 ? (
            <button
              onClick={() => setStep(s => (s + 1) as Step)}
              disabled={!eventName.trim()}
              style={{ ...btnPrimary, opacity: eventName.trim() ? 1 : 0.4 }}
            >
              Next <ChevronRight size={15} />
            </button>
          ) : (
            <button onClick={handleCreate} disabled={saving} style={{
              ...btnPrimary, opacity: saving ? 0.6 : 1,
            }}>
              {saving
                ? <><Loader2 size={14} className="animate-spin" /> Creating…</>
                : <><Plus size={14} /> Create Event</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 600,
        letterSpacing: "0.06em", textTransform: "uppercase",
        color: "var(--ct-text-2)", marginBottom: 6,
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%", height: 40,
  background: "var(--ct-surface-2)", border: "1px solid var(--ct-border)",
  borderRadius: 8, padding: "0 12px", fontSize: 14,
  color: "var(--ct-text)", outline: "none",
}

const btnPrimary: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6,
  height: 38, padding: "0 18px", background: "var(--ct-blue)",
  color: "white", border: "none", borderRadius: 8,
  fontSize: 13, fontWeight: 500, cursor: "pointer",
}

const btnSecondary: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6,
  height: 38, padding: "0 16px", background: "var(--ct-surface)",
  color: "var(--ct-text-2)", border: "1px solid var(--ct-border)",
  borderRadius: 8, fontSize: 13, cursor: "pointer",
}
