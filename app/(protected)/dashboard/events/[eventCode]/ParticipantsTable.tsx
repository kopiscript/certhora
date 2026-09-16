"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

const PER_PAGE = 15

const EMAIL_STATUS_COLORS: Record<string, string> = {
  PENDING: "#94A3B8", QUEUED: "#FBBF24", SENT: "#22C55E", FAILED: "#F87171", BOUNCED: "#F87171",
}

interface Cert {
  certId: string
  participantName: string
  participantEmail: string
  emailStatus: string
  viewCount: number
}

export function ParticipantsTable({ certificates }: { certificates: Cert[] }) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(certificates.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PER_PAGE
  const pageRows = certificates.slice(start, start + PER_PAGE)

  return (
    <div style={{
      background: "var(--ct-surface)", border: "1px solid var(--ct-border)",
      borderRadius: 10, overflow: "hidden",
    }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--ct-border)" }}>
            {["Cert ID", "Name", "Email", "Status", "Views"].map(h => (
              <th key={h} style={{
                padding: "10px 14px", textAlign: "left",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                textTransform: "uppercase", color: "var(--ct-text-3)",
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageRows.map(c => (
            <tr key={c.certId} style={{ borderBottom: "1px solid var(--ct-border)" }}>
              <td style={{ padding: "10px 14px" }}>
                <Link href={`/certs/view/${c.certId}`} target="_blank"
                  style={{ fontSize: 12, fontFamily: "monospace", color: "var(--ct-blue)", textDecoration: "none" }}>
                  {c.certId}
                </Link>
              </td>
              <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--ct-text)" }}>
                {c.participantName}
              </td>
              <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--ct-text-2)" }}>
                {c.participantEmail}
              </td>
              <td style={{ padding: "10px 14px" }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5,
                  background: `${EMAIL_STATUS_COLORS[c.emailStatus]}18`,
                  color: EMAIL_STATUS_COLORS[c.emailStatus],
                }}>
                  {c.emailStatus}
                </span>
              </td>
              <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--ct-text-3)" }}>
                {c.viewCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", borderTop: "1px solid var(--ct-border)",
        }}>
          <p style={{ fontSize: 11, color: "var(--ct-text-3)" }}>
            {start + 1}–{Math.min(start + PER_PAGE, certificates.length)} of {certificates.length}
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              style={{
                width: 28, height: 28, borderRadius: 6, border: "1px solid var(--ct-border)",
                background: "transparent", color: "var(--ct-text-2)",
                cursor: safePage <= 1 ? "not-allowed" : "pointer", opacity: safePage <= 1 ? 0.4 : 1,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ChevronLeft size={13} />
            </button>
            <span style={{ fontSize: 11, color: "var(--ct-text-2)", display: "flex", alignItems: "center", padding: "0 4px" }}>
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              style={{
                width: 28, height: 28, borderRadius: 6, border: "1px solid var(--ct-border)",
                background: "transparent", color: "var(--ct-text-2)",
                cursor: safePage >= totalPages ? "not-allowed" : "pointer", opacity: safePage >= totalPages ? 0.4 : 1,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
