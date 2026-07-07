"use client"

import { useState } from "react"
import { UserPlus } from "lucide-react"
import { AddParticipantsModal } from "./AddParticipantsModal"

export function AddParticipantsButton({ eventCode }: { eventCode: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        display: "flex", alignItems: "center", gap: 6,
        height: 28, padding: "0 10px",
        background: "var(--ct-surface-2)", border: "1px solid var(--ct-border)",
        color: "var(--ct-text-2)", borderRadius: 6,
        fontSize: 12, fontWeight: 500, cursor: "pointer",
      }}>
        <UserPlus size={12} /> Add Participants
      </button>
      {open && <AddParticipantsModal eventCode={eventCode} onClose={() => setOpen(false)} />}
    </>
  )
}
