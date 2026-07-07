"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Papa from "papaparse"
import { X, Plus, Trash2, Upload, Loader2, UserPlus } from "lucide-react"

interface Row {
  name: string
  email: string
}

const emptyRows = (): Row[] => [{ name: "", email: "" }, { name: "", email: "" }]

export function AddParticipantsModal({
  eventCode,
  onClose,
}: {
  eventCode: string
  onClose: () => void
}) {
  const router = useRouter()
  const [mode, setMode] = useState<"manual" | "csv">("manual")
  const [rows, setRows] = useState<Row[]>(emptyRows())
  const [csvFileName, setCsvFileName] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateRow = (i: number, field: keyof Row, value: string) => {
    setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  }
  const addRow = () => setRows(prev => [...prev, { name: "", email: "" }])
  const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i))

  const switchMode = (next: "manual" | "csv") => {
    setMode(next)
    setError("")
    setRows(emptyRows())
    setCsvFileName("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFileName(file.name)
    setError("")

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: result => {
        const fields = result.meta.fields ?? []
        const nameKey = fields.find(f => f.trim().toLowerCase() === "name")
        const emailKey = fields.find(f => f.trim().toLowerCase() === "email")
        if (!nameKey || !emailKey) {
          setError('CSV must have "name" and "email" columns.')
          setRows([])
          return
        }
        const parsed = result.data
          .map(r => ({ name: (r[nameKey] ?? "").trim(), email: (r[emailKey] ?? "").trim() }))
          .filter(r => r.name || r.email)
        if (parsed.length === 0) setError("No rows found in that CSV.")
        setRows(parsed)
      },
      error: err => setError(err.message),
    })
  }

  const validRows = rows.filter(r => r.name.trim() && /\S+@\S+\.\S+/.test(r.email.trim()))
  const invalidCount = rows.length - validRows.length

  const handleSubmit = async () => {
    if (validRows.length === 0) {
      setError("Add at least one participant with a name and valid email.")
      return
    }
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/events/${eventCode}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participants: validRows.map(r => ({ name: r.name.trim(), email: r.email.trim() })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.refresh()
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: 560, maxWidth: "100%", maxHeight: "85vh",
        background: "var(--card)", border: "1px solid var(--ct-border-md)",
        borderRadius: 14, padding: 24, boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <UserPlus size={16} style={{ color: "var(--ct-blue)" }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--ct-text)" }}>Add Participants</p>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 6, border: "1px solid var(--ct-border)",
            background: "transparent", color: "var(--ct-text-3)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Mode tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexShrink: 0 }}>
          {(["manual", "csv"] as const).map(m => (
            <button key={m} onClick={() => switchMode(m)} style={{
              flex: 1, height: 32, borderRadius: 7, fontSize: 12, fontWeight: 500,
              border: "1px solid var(--ct-border)",
              background: mode === m ? "var(--ct-blue-dim)" : "transparent",
              color: mode === m ? "#93C5FD" : "var(--ct-text-2)",
              cursor: "pointer",
            }}>
              {m === "manual" ? "Enter manually" : "Upload CSV"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {mode === "manual" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rows.map((row, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    className="ct-input"
                    placeholder="Full name"
                    value={row.name}
                    onChange={e => updateRow(i, "name", e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    className="ct-input"
                    placeholder="Email address"
                    type="email"
                    value={row.email}
                    onChange={e => updateRow(i, "email", e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={() => removeRow(i)}
                    disabled={rows.length <= 1}
                    title="Remove row"
                    style={{
                      width: 30, height: 30, borderRadius: 6, flexShrink: 0,
                      border: "1px solid var(--ct-border)", background: "transparent",
                      color: rows.length <= 1 ? "var(--ct-text-3)" : "var(--ct-error)",
                      cursor: rows.length <= 1 ? "not-allowed" : "pointer",
                      opacity: rows.length <= 1 ? 0.4 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button onClick={addRow} style={{
                display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start",
                height: 30, padding: "0 10px", marginTop: 4,
                border: "1px dashed var(--ct-border)", background: "transparent",
                color: "var(--ct-text-2)", borderRadius: 7, fontSize: 12, cursor: "pointer",
              }}>
                <Plus size={12} /> Add row
              </button>
            </div>
          ) : (
            <div>
              <label style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                padding: "28px 14px", border: "1px dashed var(--ct-border)", borderRadius: 10,
                cursor: "pointer", marginBottom: 14,
              }}>
                <Upload size={20} style={{ color: "var(--ct-text-3)" }} />
                <span style={{ fontSize: 13, color: "var(--ct-text-2)" }}>
                  {csvFileName || "Click to upload a .csv file"}
                </span>
                <span style={{ fontSize: 11, color: "var(--ct-text-3)" }}>
                  Must include a &quot;name&quot; and &quot;email&quot; column
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  style={{ display: "none" }}
                  onChange={handleCsvFile}
                />
              </label>

              {rows.length > 0 && (
                <div style={{ border: "1px solid var(--ct-border)", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{
                    padding: "8px 12px", background: "var(--ct-surface-2)", fontSize: 11,
                    color: "var(--ct-text-3)", borderBottom: "1px solid var(--ct-border)",
                  }}>
                    {validRows.length} valid{invalidCount > 0 ? `, ${invalidCount} skipped (missing name or invalid email)` : ""}
                  </div>
                  <div style={{ maxHeight: 220, overflowY: "auto" }}>
                    {rows.map((row, i) => {
                      const isValid = row.name.trim() && /\S+@\S+\.\S+/.test(row.email.trim())
                      return (
                        <div key={i} style={{
                          display: "flex", gap: 10, padding: "6px 12px", fontSize: 12,
                          borderBottom: "1px solid var(--ct-border)",
                          color: isValid ? "var(--ct-text-2)" : "var(--ct-error)",
                        }}>
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {row.name || "—"}
                          </span>
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {row.email || "—"}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <p style={{
              fontSize: 12, color: "var(--ct-error)", padding: "8px 10px", borderRadius: 6,
              background: "var(--ct-error-bg)", border: "1px solid var(--ct-error-border)",
              marginTop: 12,
            }}>
              {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={onClose} style={{
            height: 36, padding: "0 16px", borderRadius: 8,
            border: "1px solid var(--ct-border)", background: "transparent",
            color: "var(--ct-text-2)", fontSize: 13, cursor: "pointer",
          }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving || validRows.length === 0} style={{
            height: 36, padding: "0 18px", borderRadius: 8,
            background: (saving || validRows.length === 0) ? "var(--ct-surface-2)" : "var(--ct-blue)",
            border: "none",
            color: (saving || validRows.length === 0) ? "var(--ct-text-3)" : "#fff",
            fontSize: 13, fontWeight: 500,
            cursor: (saving || validRows.length === 0) ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {saving
              ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Adding…</>
              : <>Add {validRows.length > 0 ? `${validRows.length} ` : ""}Participant{validRows.length === 1 ? "" : "s"}</>}
          </button>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
