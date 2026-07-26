"use client"

import { Printer } from "lucide-react"

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        height: 34, padding: "0 14px", borderRadius: 8,
        border: "1px solid #CBD5E1", background: "#fff", color: "#334155",
        fontSize: 12, fontWeight: 600, cursor: "pointer",
      }}
    >
      <Printer size={13} />
      Print / Save as PDF
    </button>
  )
}
