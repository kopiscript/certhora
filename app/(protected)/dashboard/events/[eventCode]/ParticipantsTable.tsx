"use client"

import { useState } from "react"
import Link from "next/link"
import { DownloadPdfButton } from "./DownloadPdfButton"
import { RegenerateButton } from "./RegenerateButton"
import { ChevronLeft, ChevronRight, Printer } from "lucide-react"

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

export function ParticipantsTable({ certificates, eventCode }: { certificates: Cert[]; eventCode: string }) {
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const totalPages = Math.max(1, Math.ceil(certificates.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PER_PAGE
  const pageRows = certificates.slice(start, start + PER_PAGE)

  const pageSelectable = pageRows.filter(c => c.emailStatus !== "PENDING")
  const allPageSelected = pageSelectable.length > 0 && pageSelectable.every(c => selected.has(c.certId))

  const toggleOne = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const togglePage = () =>
    setSelected(prev => {
      const next = new Set(prev)
      for (const c of pageSelectable) {
        if (allPageSelected) next.delete(c.certId)
        else next.add(c.certId)
      }
      return next
    })

  const pdfHref = `/api/events/${eventCode}/certificates-pdf?ids=${encodeURIComponent(Array.from(selected).join(","))}`
  const printHref = `/dashboard/events/${eventCode}/print?ids=${encodeURIComponent(Array.from(selected).join(","))}`

  return (
    <div>
    {selected.size > 0 && (
      <div style={{
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        padding: "8px 12px", marginBottom: 10,
        background: "var(--ct-blue-dim)", border: "1px solid rgba(37,99,235,0.22)",
        borderRadius: 8, fontSize: 12, color: "var(--ct-text)",
      }}>
        <span style={{ fontWeight: 600 }}>{selected.size} selected</span>
        <span style={{ color: "var(--ct-text-2)" }}>Only the ticked people will be printed or saved.</span>
        <Link href={printHref} target="_blank" title="Opens a print preview with only the ticked certificates." style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 6,
          background: "var(--ct-blue)", color: "#fff",
          fontWeight: 600, textDecoration: "none",
        }}>
          <Printer size={12} />
          Print selected
        </Link>
        <DownloadPdfButton
          href={pdfHref}
          title="Saves only the ticked certificates as a PDF file."
          style={{
            padding: "5px 12px", borderRadius: 6,
            background: "transparent",
            border: "1px solid rgba(37,99,235,0.35)", color: "var(--ct-text)",
            fontSize: 12, fontWeight: 600,
          }}
        />
        <RegenerateButton
          eventCode={eventCode}
          ids={Array.from(selected)}
          count={selected.size}
          label="Regenerate selected"
          title="Redraws only the ticked certificates with the current design. Links stay the same, no emails are sent and no quota is used."
          style={{
            padding: "5px 12px", borderRadius: 6,
            background: "transparent",
            border: "1px solid rgba(37,99,235,0.35)", color: "var(--ct-text)",
            fontSize: 12, fontWeight: 600,
          }}
        />
        <button onClick={() => setSelected(new Set())} style={{
          background: "transparent", border: "none", cursor: "pointer",
          color: "var(--ct-text-2)", fontSize: 12,
        }}>
          Clear
        </button>
      </div>
    )}
    <div style={{
      background: "var(--ct-surface)", border: "1px solid var(--ct-border)",
      borderRadius: 10, overflow: "hidden",
    }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--ct-border)" }}>
            <th style={{ padding: "10px 14px", width: 32 }}>
              <input
                type="checkbox"
                aria-label="Select all on this page"
                title="Select everyone on this page. Your ticks stay when you change page."
                checked={allPageSelected}
                disabled={pageSelectable.length === 0}
                onChange={togglePage}
              />
            </th>
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
                <input
                  type="checkbox"
                  aria-label={`Select ${c.participantName}`}
                  checked={selected.has(c.certId)}
                  disabled={c.emailStatus === "PENDING"}
                  title={c.emailStatus === "PENDING" ? "This certificate is not generated yet, so it can't be printed. Click Generate Certificates first." : undefined}
                  onChange={() => toggleOne(c.certId)}
                />
              </td>
              <td style={{ padding: "10px 14px" }}>
                <Link href={`/certs/view/${c.certId}`} target="_blank"
                  style={{ fontSize: 12, fontFamily: "monospace", color: "var(--ct-blue)", textDecoration: "none" }}>
                  {c.certId}
                </Link>
              </td>
              <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--ct-text)", maxWidth: 300 }}>
                <span
                  title={c.participantName}
                  style={{
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    overflow: "hidden", overflowWrap: "anywhere", lineHeight: 1.35,
                  }}
                >
                  {c.participantName}
                </span>
              </td>
              <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--ct-text-2)", maxWidth: 240 }}>
                <span
                  title={c.participantEmail}
                  style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {c.participantEmail}
                </span>
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
    </div>
  )
}
