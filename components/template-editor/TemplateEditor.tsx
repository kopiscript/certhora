"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Upload, Move, QrCode, Type, Plus, Trash2 } from "lucide-react"
import { nanoid } from "nanoid"

// ─── Constants ────────────────────────────────────────────────────────────────

const CERT_W = 1200
const CERT_H = 840
const DISPLAY_W = 720
const SCALE = DISPLAY_W / CERT_W
const DISPLAY_H = Math.round(CERT_H * SCALE)  // 504

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdditionalPlaceholder {
  id: string
  label: string
  value: string
  x: number
  y: number
  fontSize: number
  color: string
  font: string
}

export interface TemplateLayout {
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
  primaryColor: string
  additional: AdditionalPlaceholder[]
}

export const DEFAULT_LAYOUT: TemplateLayout = {
  nameCenterX: 600, nameY: 340, nameMaxWidth: 840, nameFontSize: 52,
  nameFont: "Arial, Helvetica, sans-serif", nameColor: "#1E293B",
  qrX: 1010, qrY: 628, qrSize: 140,
  certIdFont: "monospace", certIdColor: "#64748B",
  showWatermark: false, primaryColor: "#1D4ED8",
  additional: [],
}

interface Props {
  initial?: Partial<TemplateLayout>
  initialImageUrl?: string
  onChange: (layout: TemplateLayout, imageUrl: string | null) => void
}

type DragTarget = { kind: "name" | "qr" } | { kind: "additional"; id: string } | null

// ─── Component ────────────────────────────────────────────────────────────────

export function TemplateEditor({ initial, initialImageUrl, onChange }: Props) {
  const [layout, setLayout] = useState<TemplateLayout>({ ...DEFAULT_LAYOUT, ...initial })
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl ?? null)
  const [previewBlob, setPreviewBlob] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ target: DragTarget; ox: number; oy: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    onChange(layout, imageUrl)
  }, [layout, imageUrl, onChange])

  const updateLayout = useCallback(
    (patch: Partial<TemplateLayout>) => setLayout(prev => ({ ...prev, ...patch })),
    []
  )

  const updateAdditional = useCallback((id: string, patch: Partial<AdditionalPlaceholder>) => {
    setLayout(prev => ({
      ...prev,
      additional: prev.additional.map(p => p.id === id ? { ...p, ...patch } : p),
    }))
  }, [])

  const removeAdditional = useCallback((id: string) => {
    setLayout(prev => ({ ...prev, additional: prev.additional.filter(p => p.id !== id) }))
    setSelectedId(prev => prev === id ? null : prev)
  }, [])

  const addAdditional = useCallback(() => {
    const id = nanoid(8)
    const newPlaceholder: AdditionalPlaceholder = {
      id,
      label: "New Field",
      value: "Field Value",
      x: 200,
      y: 500,
      fontSize: 16,
      color: "#475569",
      font: "Arial, Helvetica, sans-serif",
    }
    setLayout(prev => ({ ...prev, additional: [...prev.additional, newPlaceholder] }))
    setSelectedId(id)
  }, [])

  // ── Drag handlers ────────────────────────────────────────────────────────

  const onMouseDown = (e: React.MouseEvent, target: DragTarget) => {
    e.preventDefault()
    e.stopPropagation()
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    let ox = 0, oy = 0
    if (target?.kind === "name") {
      ox = mx - layout.nameCenterX * SCALE
      oy = my - layout.nameY * SCALE
    } else if (target?.kind === "qr") {
      ox = mx - layout.qrX * SCALE
      oy = my - layout.qrY * SCALE
    } else if (target?.kind === "additional") {
      const p = layout.additional.find(a => a.id === target.id)
      if (!p) return
      ox = mx - p.x * SCALE
      oy = my - p.y * SCALE
      setSelectedId(target.id)
    }
    dragRef.current = { target, ox, oy }
  }

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const { target, ox, oy } = dragRef.current
      const cx = Math.max(0, Math.min((mx - ox) / SCALE, CERT_W))
      const cy = Math.max(0, Math.min((my - oy) / SCALE, CERT_H))
      if (target?.kind === "name") {
        setLayout(p => ({ ...p, nameCenterX: Math.round(cx), nameY: Math.round(cy) }))
      } else if (target?.kind === "qr") {
        setLayout(p => ({ ...p, qrX: Math.round(cx), qrY: Math.round(cy) }))
      } else if (target?.kind === "additional") {
        setLayout(p => ({
          ...p,
          additional: p.additional.map(a =>
            a.id === (target as { kind: "additional"; id: string }).id
              ? { ...a, x: Math.round(cx), y: Math.round(cy) }
              : a
          ),
        }))
      }
    }
    const up = () => { dragRef.current = null }
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
    return () => {
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseup", up)
    }
  }, [])

  // ── Image upload ─────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const blob = URL.createObjectURL(file)
    setPreviewBlob(blob)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/templates/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImageUrl(data.url)
    } catch (err) {
      alert(`Upload failed: ${(err as Error).message}`)
      setPreviewBlob(null)
    } finally {
      setUploading(false)
    }
  }

  const displayImage = previewBlob ?? imageUrl
  const selectedPlaceholder = layout.additional.find(p => p.id === selectedId) ?? null

  // ── QR placeholder ───────────────────────────────────────────────────────

  const QRPlaceholder = () => (
    <div style={{
      width: "100%", height: "100%",
      display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gridTemplateRows: "repeat(5, 1fr)",
      gap: 1, padding: 3,
    }}>
      {Array.from({ length: 25 }, (_, i) => {
        const corners = [0,1,2,3,5,6,7,8,10,14,16,17,18,19,21,22,23,24]
        return (
          <div key={i} style={{
            background: corners.includes(i) ? "#000" : i === 12 ? "#000" : "transparent",
            borderRadius: 1,
          }} />
        )
      })}
    </div>
  )

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

      {/* ── Canvas ─────────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0 }}>
        <div
          ref={containerRef}
          style={{
            position: "relative",
            width: DISPLAY_W,
            height: DISPLAY_H,
            background: displayImage ? "transparent" : "#f8fafc",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            overflow: "hidden",
            userSelect: "none",
            cursor: "default",
          }}
          onClick={() => setSelectedId(null)}
        >
          {/* Background */}
          {displayImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayImage} alt="template background"
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: `linear-gradient(135deg, #0c0c1d 0%, ${layout.primaryColor}22 50%, #0d1535 100%)`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 12,
            }}>
              <div style={{
                width: "100%", height: 60, background: layout.primaryColor,
                position: "absolute", top: 0, left: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ color: "white", fontSize: 11, letterSpacing: 4, fontWeight: 600 }}>
                  CERTIFICATE OF COMPLETION
                </span>
              </div>
              <Upload size={24} style={{ color: "var(--ct-text-3)", marginTop: 30 }} />
              <p style={{ fontSize: 12, color: "var(--ct-text-3)", textAlign: "center" }}>
                Upload a background image<br />or use the procedural template
              </p>
            </div>
          )}

          {/* ── Name element ─────────────────────────────────────────── */}
          <div
            onMouseDown={e => onMouseDown(e, { kind: "name" })}
            style={{
              position: "absolute",
              left: layout.nameCenterX * SCALE,
              top: layout.nameY * SCALE,
              transform: "translate(-50%, -50%)",
              cursor: "grab",
              padding: "4px 8px",
              border: "1.5px dashed rgba(37,99,235,0.7)",
              borderRadius: 4,
              background: "rgba(37,99,235,0.06)",
              whiteSpace: "nowrap",
              maxWidth: layout.nameMaxWidth * SCALE,
              overflow: "hidden",
            }}
          >
            <span style={{
              fontSize: Math.min(layout.nameFontSize * SCALE, 32),
              fontFamily: layout.nameFont,
              color: layout.nameColor,
              fontWeight: "bold",
              display: "block",
              textOverflow: "ellipsis",
              overflow: "hidden",
            }}>
              Participant Name
            </span>
            <div style={{
              position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
              background: "#2563EB", borderRadius: 3, padding: "1px 5px",
              fontSize: 9, color: "white", fontWeight: 600, letterSpacing: 0.5,
              pointerEvents: "none",
            }}>
              <Move size={9} style={{ display: "inline", marginRight: 3 }} />
              NAME
            </div>
          </div>

          {/* ── QR element ────────────────────────────────────────────── */}
          <div
            onMouseDown={e => onMouseDown(e, { kind: "qr" })}
            style={{
              position: "absolute",
              left: layout.qrX * SCALE,
              top: layout.qrY * SCALE,
              width: layout.qrSize * SCALE,
              height: layout.qrSize * SCALE,
              cursor: "grab",
              border: "1.5px dashed rgba(37,99,235,0.7)",
              borderRadius: 4,
              background: "rgba(255,255,255,0.9)",
              overflow: "hidden",
            }}
          >
            <QRPlaceholder />
            <div style={{
              position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
              background: "#2563EB", borderRadius: 3, padding: "1px 5px",
              fontSize: 9, color: "white", fontWeight: 600, letterSpacing: 0.5,
              whiteSpace: "nowrap", pointerEvents: "none",
            }}>
              <QrCode size={9} style={{ display: "inline", marginRight: 3 }} />
              QR
            </div>
          </div>

          {/* ── Additional placeholders ───────────────────────────────── */}
          {layout.additional.map(p => (
            <div
              key={p.id}
              onMouseDown={e => onMouseDown(e, { kind: "additional", id: p.id })}
              style={{
                position: "absolute",
                left: p.x * SCALE,
                top: p.y * SCALE,
                transform: "translate(0, -50%)",
                cursor: "grab",
                padding: "2px 6px",
                border: `1.5px dashed ${selectedId === p.id ? "rgba(234,179,8,0.9)" : "rgba(234,179,8,0.5)"}`,
                borderRadius: 4,
                background: selectedId === p.id ? "rgba(234,179,8,0.12)" : "rgba(234,179,8,0.06)",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{
                fontSize: Math.max(p.fontSize * SCALE, 9),
                fontFamily: p.font,
                color: p.color,
                display: "block",
              }}>
                {p.value || p.label}
              </span>
              <div style={{
                position: "absolute", top: -8, left: 0,
                background: "#B45309", borderRadius: 3, padding: "1px 5px",
                fontSize: 9, color: "white", fontWeight: 600, letterSpacing: 0.5,
                pointerEvents: "none", whiteSpace: "nowrap",
              }}>
                <Move size={9} style={{ display: "inline", marginRight: 3 }} />
                {p.label}
              </div>
            </div>
          ))}
        </div>

        {/* Upload button */}
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              fontSize: 12, padding: "7px 14px",
              background: "var(--ct-surface)", border: "1px solid var(--ct-border)",
              borderRadius: 7, color: "var(--ct-text-2)", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              opacity: uploading ? 0.6 : 1,
            }}
          >
            <Upload size={13} />
            {uploading ? "Uploading…" : "Upload background"}
          </button>
          {displayImage && (
            <button
              type="button"
              onClick={() => { setPreviewBlob(null); setImageUrl(null) }}
              style={{
                fontSize: 12, padding: "7px 14px",
                background: "var(--ct-error-bg)", border: "1px solid var(--ct-error-border)",
                borderRadius: 7, color: "var(--ct-error)", cursor: "pointer",
              }}
            >
              Remove
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp"
            style={{ display: "none" }} onChange={handleFileChange} />
        </div>

        <p style={{ marginTop: 8, fontSize: 11, color: "var(--ct-text-3)" }}>
          Name: ({layout.nameCenterX}, {layout.nameY}) · QR: ({layout.qrX}, {layout.qrY})
          · Canvas: {CERT_W}×{CERT_H}px
        </p>
      </div>

      {/* ── Settings panel ─────────────────────────────────────────────── */}
      <div style={{
        flex: 1, minWidth: 220,
        background: "var(--ct-surface)", border: "1px solid var(--ct-border)",
        borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 18,
      }}>

        <Section icon={<Type size={13} />} label="Name">
          <Field label="Font family">
            <select value={layout.nameFont}
              onChange={e => updateLayout({ nameFont: e.target.value })}
              style={selectStyle}>
              <option value="Arial, Helvetica, sans-serif">Arial</option>
              <option value="Georgia, 'Times New Roman', serif">Georgia</option>
              <option value="'Trebuchet MS', sans-serif">Trebuchet</option>
              <option value="Verdana, Geneva, sans-serif">Verdana</option>
              <option value="monospace">Monospace</option>
            </select>
          </Field>
          <TwoCol>
            <Field label="Font size (px)">
              <NumInput value={layout.nameFontSize} min={14} max={120}
                onChange={v => updateLayout({ nameFontSize: v })} />
            </Field>
            <Field label="Color">
              <ColorInput value={layout.nameColor}
                onChange={v => updateLayout({ nameColor: v })} />
            </Field>
          </TwoCol>
          <TwoCol>
            <Field label="Center X">
              <NumInput value={layout.nameCenterX} min={0} max={CERT_W}
                onChange={v => updateLayout({ nameCenterX: v })} />
            </Field>
            <Field label="Y">
              <NumInput value={layout.nameY} min={0} max={CERT_H}
                onChange={v => updateLayout({ nameY: v })} />
            </Field>
          </TwoCol>
          <Field label="Max width (px)">
            <NumInput value={layout.nameMaxWidth} min={100} max={CERT_W}
              onChange={v => updateLayout({ nameMaxWidth: v })} />
          </Field>
        </Section>

        <Section icon={<QrCode size={13} />} label="QR Code">
          <TwoCol>
            <Field label="X">
              <NumInput value={layout.qrX} min={0} max={CERT_W}
                onChange={v => updateLayout({ qrX: v })} />
            </Field>
            <Field label="Y">
              <NumInput value={layout.qrY} min={0} max={CERT_H}
                onChange={v => updateLayout({ qrY: v })} />
            </Field>
          </TwoCol>
          <Field label="Size (px)">
            <NumInput value={layout.qrSize} min={60} max={300}
              onChange={v => updateLayout({ qrSize: v })} />
          </Field>
        </Section>

        <Section label="Cert ID">
          <TwoCol>
            <Field label="Font">
              <select value={layout.certIdFont}
                onChange={e => updateLayout({ certIdFont: e.target.value })}
                style={selectStyle}>
                <option value="monospace">Monospace</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Georgia, serif">Georgia</option>
              </select>
            </Field>
            <Field label="Color">
              <ColorInput value={layout.certIdColor}
                onChange={v => updateLayout({ certIdColor: v })} />
            </Field>
          </TwoCol>
        </Section>

        <Section label="Branding">
          <Field label="Primary color">
            <ColorInput value={layout.primaryColor}
              onChange={v => updateLayout({ primaryColor: v })} />
          </Field>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={layout.showWatermark}
              onChange={e => updateLayout({ showWatermark: e.target.checked })}
              style={{ accentColor: "#2563EB" }} />
            <span style={{ fontSize: 12, color: "var(--ct-text-2)" }}>
              Show logo watermark on QR
            </span>
          </label>
        </Section>

        {/* ── Additional placeholders ────────────────────────────────── */}
        <Section label="Text Placeholders">
          {layout.additional.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--ct-text-3)" }}>
              Add custom text fields like date, location, or duration.
            </p>
          )}

          {layout.additional.map(p => (
            <div
              key={p.id}
              onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
              style={{
                border: `1px solid ${selectedId === p.id ? "rgba(234,179,8,0.5)" : "var(--ct-border)"}`,
                borderRadius: 8,
                padding: 10,
                cursor: "pointer",
                background: selectedId === p.id ? "rgba(234,179,8,0.06)" : "var(--ct-surface-2)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: selectedId === p.id ? 10 : 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ct-text)" }}>{p.label}</span>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeAdditional(p.id) }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--ct-text-3)" }}
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {selectedId === p.id && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }} onClick={e => e.stopPropagation()}>
                  <Field label="Label">
                    <input value={p.label} onChange={e => updateAdditional(p.id, { label: e.target.value })}
                      style={{ ...inputStyle, width: "100%" }} />
                  </Field>
                  <Field label="Value">
                    <input value={p.value} onChange={e => updateAdditional(p.id, { value: e.target.value })}
                      style={{ ...inputStyle, width: "100%" }} placeholder="e.g. 15 March 2025" />
                  </Field>
                  <TwoCol>
                    <Field label="Font size">
                      <NumInput value={p.fontSize} min={8} max={72}
                        onChange={v => updateAdditional(p.id, { fontSize: v })} />
                    </Field>
                    <Field label="Color">
                      <ColorInput value={p.color} onChange={v => updateAdditional(p.id, { color: v })} />
                    </Field>
                  </TwoCol>
                  <Field label="Font">
                    <select value={p.font} onChange={e => updateAdditional(p.id, { font: e.target.value })}
                      style={selectStyle}>
                      <option value="Arial, Helvetica, sans-serif">Arial</option>
                      <option value="Georgia, 'Times New Roman', serif">Georgia</option>
                      <option value="'Trebuchet MS', sans-serif">Trebuchet</option>
                      <option value="Verdana, Geneva, sans-serif">Verdana</option>
                      <option value="monospace">Monospace</option>
                    </select>
                  </Field>
                  <TwoCol>
                    <Field label="X">
                      <NumInput value={p.x} min={0} max={CERT_W}
                        onChange={v => updateAdditional(p.id, { x: v })} />
                    </Field>
                    <Field label="Y">
                      <NumInput value={p.y} min={0} max={CERT_H}
                        onChange={v => updateAdditional(p.id, { y: v })} />
                    </Field>
                  </TwoCol>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addAdditional}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              height: 32, padding: "0 12px", width: "100%", justifyContent: "center",
              background: "var(--ct-surface-2)", border: "1px dashed var(--ct-border)",
              borderRadius: 7, fontSize: 12, color: "var(--ct-text-2)", cursor: "pointer",
            }}
          >
            <Plus size={12} /> Add placeholder
          </button>
        </Section>
      </div>
    </div>
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Section({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <p style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
        color: "var(--ct-text-2)", marginBottom: 8, display: "flex", alignItems: "center", gap: 5,
      }}>
        {icon}{label}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </div>
  )
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: "var(--ct-text-3)", marginBottom: 4 }}>{label}</p>
      {children}
    </div>
  )
}

function NumInput({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <input type="number" min={min} max={max} value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{ ...inputStyle, width: "100%" }} />
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: 28, height: 28, border: "none", borderRadius: 4, cursor: "pointer", padding: 2 }} />
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, flex: 1, fontFamily: "monospace", fontSize: 11 }} />
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  height: 30, background: "var(--ct-surface-2)", border: "1px solid var(--ct-border)",
  borderRadius: 6, padding: "0 8px", fontSize: 12, color: "var(--ct-text)", outline: "none",
}

const selectStyle: React.CSSProperties = {
  ...inputStyle, width: "100%", cursor: "pointer",
}
