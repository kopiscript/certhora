"use client"

import { useState } from "react"
import { UserPlus } from "lucide-react"
import { AddParticipantsModal, type CustomField } from "./AddParticipantsModal"

export function AddParticipantsButton({ eventCode, fields = [] }: { eventCode: string; fields?: CustomField[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} title="Add people one by one, or upload a CSV file with names and emails" style={{
        display: "flex", alignItems: "center", gap: 6,
        height: 28, padding: "0 10px",
        background: "var(--ct-surface-2)", border: "1px solid var(--ct-border)",
        color: "var(--ct-text-2)", borderRadius: 6,
        fontSize: 12, fontWeight: 500, cursor: "pointer",
      }}>
        <UserPlus size={12} /> Add Participants
      </button>
      {open && <AddParticipantsModal eventCode={eventCode} fields={fields} onClose={() => setOpen(false)} />}
    </>
  )
}
