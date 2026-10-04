"use client"

import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { Info } from "lucide-react"

interface Props {
  children: ReactNode
  label?: string
  width?: number
}

export function InfoTip({ children, label = "More information", width = 280 }: Props) {
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const tipId = useId()
  const open = pinned || hovered

  useEffect(() => {
    if (!pinned) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setPinned(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPinned(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("touchstart", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("touchstart", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [pinned])

  return (
    <span
      ref={ref}
      style={{ position: "relative", display: "inline-flex", verticalAlign: "middle" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        onClick={() => setPinned((v) => !v)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 20, height: 20, borderRadius: "50%", padding: 0,
          background: open ? "rgba(96,165,250,0.30)" : "rgba(96,165,250,0.16)",
          border: "1px solid rgba(96,165,250,0.55)", cursor: "pointer",
          color: "#60A5FA",
          boxShadow: open
            ? "0 0 0 3px rgba(96,165,250,0.22), 0 0 14px rgba(96,165,250,0.65)"
            : "0 0 8px rgba(96,165,250,0.45)",
          transition: "box-shadow 150ms, background 150ms",
        }}
      >
        <Info size={14} />
      </button>
      {open && (
        <span
          id={tipId}
          role="tooltip"
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: -6, zIndex: 60,
            width, maxWidth: "min(" + width + "px, 80vw)",
            padding: "10px 12px", borderRadius: 8,
            background: "var(--ct-surface-2)", border: "1px solid var(--ct-border-md)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            fontSize: 12, fontWeight: 400, lineHeight: 1.55,
            letterSpacing: "normal", textTransform: "none",
            color: "var(--ct-text-2)", textAlign: "left",
          }}
        >
          {children}
        </span>
      )}
    </span>
  )
}
