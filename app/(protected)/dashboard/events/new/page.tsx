"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ChevronRight, ChevronLeft, Plus, Trash2, Upload } from "lucide-react"

type Step = 1 | 2 | 3

interface Template { id: string; name: string; primaryColor: string; imageUrl: string | null }
interface Participant { name: string; email: string }

export default function NewEventPage() {
  const router = useRouter()

  // Step state
  const [step, setStep] = useState<Step>(1)

  // Step 1 — details
  const [eventName, setEventName] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [description, setDescription] = useState("")
  const [skillsRaw, setSkillsRaw] = useState("")

  // Step 2 — participants
  const [csvText, setCsvText] = useState("")
  const [participants, setParticipants] = useState<Participant[]>([])
  const [parseError, setParseError] = useState("")

  // Templates list
  const [templates, setTemplates] = useState<Template[]>([])

  // Submission
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/templates")
      .then(r => r.json())
      .then(setTemplates)
      .catch(() => {})
  }, [])

  // ── CSV parser ────────────────────────────────────────────────────────────

  const parseCsv = () => {
    setParseError("")
    const lines = csvText.trim().split("\n").filter(l => l.trim())
    const parsed: Participant[] = []
    const errors: string[] = []

    lines.forEach((line, i) => {
      const parts = line.split(",").map(p => p.trim())
      if (parts.length < 2) {
        errors.push(`Line ${i + 1}: expected "Name, email"`)
        return
      }
      const [name, email] = parts
      if (!name) { errors.push(`Line ${i + 1}: name is empty`); return }
      if (!email.includes("@")) { errors.push(`Line ${i + 1}: invalid email`); return }
      parsed.push({ name, email })
    })

    if (errors.length > 0) { setParseError(errors.slice(0, 3).join(" · ")); return }
    setParticipants(parsed)
  }

  const removeParticipant = (i: number) =>
    setParticipants(prev => prev.filter((_, idx) => idx !== i))

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (participants.length === 0) { setError("Add at least one participant"); return }
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: eventName.trim(),
          templateId: templateId || undefined,
          eventDate: eventDate || undefined,
          expiryDate: expiryDate || undefined,
          description: description.trim() || undefined,
          skills: skillsRaw.split(",").map(s => s.trim()).filter(Boolean),
          participants,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/dashboard/events/${data.eventCode}`)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
      setSaving(false)
    }
  }

  const canGoNext = step === 1 ? !!eventName.trim() : participants.length > 0

  return (
    <div className="flex flex-col flex-1">
      <header className="h-16 flex items-center justify-between px-8 border-b shrink-0"
        style={{ borderColor: "var(--ct-border)" }}>
        <div>
          <h1 className="text-sm font-semibold">New Event</h1>
          <p className="text-xs" style={{ color: "var(--ct-text-3)" }}>Step {step} of 2</p>
        </div>

        {/* Step indicator */}
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

      <div className="flex-1 p-8 overflow-auto" style={{ maxWidth: 680 }}>

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

            <Field label="Template">
              <select value={templateId} onChange={e => setTemplateId(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">— Use procedural (no template) —</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {templates.length === 0 && (
                <p style={{ fontSize: 11, color: "var(--ct-text-3)", marginTop: 5 }}>
                  No templates yet.{" "}
                  <a href="/dashboard/templates/new" style={{ color: "var(--ct-blue)" }}>
                    Create one
                  </a>
                </p>
              )}
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
          </div>
        )}

        {/* ── Step 2: Participants ────────────────────────────────────── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <p style={{ fontSize: 13, color: "var(--ct-text-2)", marginBottom: 8 }}>
                Paste participants as CSV — one per line: <code style={{ fontSize: 12 }}>Name, email</code>
              </p>
              <textarea
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                rows={8}
                placeholder={"Ahmad Fadzil, ahmad@example.com\nNur Aisha, nuraisha@example.com\nRaj Kumar, raj@example.com"}
                spellCheck={false}
                style={{
                  width: "100%", fontFamily: "monospace", fontSize: 12,
                  background: "var(--ct-surface-2)", border: "1px solid var(--ct-border)",
                  borderRadius: 8, padding: "10px 12px", color: "var(--ct-text)",
                  resize: "vertical", outline: "none",
                }}
              />
              {parseError && (
                <p style={{ fontSize: 12, color: "var(--ct-error)", marginTop: 6 }}>{parseError}</p>
              )}
              <button onClick={parseCsv} style={{
                marginTop: 8, height: 34, padding: "0 14px",
                background: "var(--ct-surface)", border: "1px solid var(--ct-border)",
                borderRadius: 7, fontSize: 13, color: "var(--ct-text-2)", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <Upload size={13} /> Parse CSV
              </button>
            </div>

            {participants.length > 0 && (
              <div>
                <p style={{ fontSize: 12, color: "var(--ct-text-2)", marginBottom: 8, fontWeight: 600 }}>
                  {participants.length} participant{participants.length !== 1 ? "s" : ""} ready
                </p>
                <div style={{
                  background: "var(--ct-surface)", border: "1px solid var(--ct-border)",
                  borderRadius: 8, overflow: "hidden",
                }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--ct-border)" }}>
                        {["#", "Name", "Email", ""].map(h => (
                          <th key={h} style={{
                            padding: "8px 12px", textAlign: "left",
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                            textTransform: "uppercase", color: "var(--ct-text-3)",
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {participants.slice(0, 50).map((p, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--ct-border)" }}>
                          <td style={{ padding: "8px 12px", fontSize: 11, color: "var(--ct-text-3)", width: 36 }}>{i + 1}</td>
                          <td style={{ padding: "8px 12px", fontSize: 13, color: "var(--ct-text)" }}>{p.name}</td>
                          <td style={{ padding: "8px 12px", fontSize: 12, color: "var(--ct-text-2)" }}>{p.email}</td>
                          <td style={{ padding: "8px 12px", width: 32 }}>
                            <button onClick={() => removeParticipant(i)} style={{
                              background: "none", border: "none", cursor: "pointer", padding: 0,
                              color: "var(--ct-text-3)",
                            }}>
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {participants.length > 50 && (
                    <p style={{ padding: "8px 12px", fontSize: 12, color: "var(--ct-text-3)" }}>
                      + {participants.length - 50} more
                    </p>
                  )}
                </div>
              </div>
            )}
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
            <button onClick={() => setStep(s => (s + 1) as Step)} disabled={!canGoNext} style={{
              ...btnPrimary, opacity: canGoNext ? 1 : 0.4,
            }}>
              Next <ChevronRight size={15} />
            </button>
          ) : (
            <button onClick={handleCreate} disabled={saving || participants.length === 0} style={{
              ...btnPrimary, opacity: saving || participants.length === 0 ? 0.6 : 1,
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
