"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function MockPayActions({ billcode }: { billcode: string }) {
  const router = useRouter()
  const [pending, setPending] = useState<"SUCCESS" | "FAILED" | null>(null)

  async function simulate(status: "SUCCESS" | "FAILED") {
    setPending(status)
    await fetch("/api/billing/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billcode, status }),
    })
    router.push("/dashboard/billing")
  }

  return (
    <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
      <button
        onClick={() => simulate("SUCCESS")}
        disabled={pending !== null}
        style={{
          flex: 1, height: 38, borderRadius: 8, border: "none",
          background: "#22C55E", color: "#06250F", fontSize: 13, fontWeight: 600,
          cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1,
        }}
      >
        {pending === "SUCCESS" ? "Processing…" : "Simulate Success"}
      </button>
      <button
        onClick={() => simulate("FAILED")}
        disabled={pending !== null}
        style={{
          flex: 1, height: 38, borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)",
          background: "transparent", color: "#FCA5A5", fontSize: 13, fontWeight: 600,
          cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1,
        }}
      >
        {pending === "FAILED" ? "Processing…" : "Simulate Failure"}
      </button>
    </div>
  )
}
