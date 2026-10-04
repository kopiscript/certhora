"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Printer, ArrowLeft } from "lucide-react"
import { DownloadPdfButton } from "../DownloadPdfButton"
import { InfoTip } from "@/components/info-tip"

interface Props {
  eventCode: string
  eventName: string
  certs: { certId: string; src: string }[]
  rangeStart: number
  rangeEnd: number
  total: number
  skipped: number
  nextHref: string | null
  pdfHref: string
}

export function PrintSheet({ eventCode, eventName, certs, rangeStart, rangeEnd, total, skipped, nextHref, pdfHref }: Props) {
  const [loaded, setLoaded] = useState(0)
  const printed = useRef(false)
  const done = useRef(new Set<string>())
  const ready = loaded >= certs.length

  useEffect(() => {
    if (ready && certs.length > 0 && !printed.current) {
      printed.current = true
      window.print()
    }
  }, [ready, certs.length])

  const markLoaded = (id: string) => {
    if (done.current.has(id)) return
    done.current.add(id)
    setLoaded(done.current.size)
  }

  return (
    <div className="print-root">
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        @media print {
          aside, .no-print { display: none !important; }
          html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
          main { display: block !important; }
          .print-root { padding: 0 !important; margin: 0 !important; }
          .print-page {
            width: 297mm !important; height: 210mm !important; max-width: none !important;
            aspect-ratio: auto !important; overflow: hidden; margin: 0 !important;
            break-after: page; page-break-after: always;
          }
          .print-page:last-child { break-after: auto; page-break-after: auto; }
        }
      `}</style>

      <div className="no-print p-8 space-y-4">
        <Link
          href={`/dashboard/events/${eventCode}`}
          className="inline-flex items-center gap-1.5 text-xs"
          style={{ color: "var(--ct-text-2)" }}
        >
          <ArrowLeft size={13} /> Back to {eventName}
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          {certs.length > 0 && (
            <DownloadPdfButton
              href={pdfHref}
              title="Saves these certificates as a PDF file with no date or web address on the page."
              style={{
                height: 36, padding: "0 16px", borderRadius: 8,
                background: "var(--ct-blue)", color: "#fff",
                border: "none", fontSize: 14, fontWeight: 600,
              }}
            />
          )}
          <button
            onClick={() => window.print()}
            title="Opens your browser's print window. For a clean result, untick Headers and footers there."
            disabled={!ready || certs.length === 0}
            className="inline-flex items-center gap-2 text-sm font-medium"
            style={{ padding: "0 16px", height: 36, border: "1px solid var(--ct-border)", borderRadius: 8, color: "var(--ct-text-2)", opacity: !ready ? 0.6 : 1 }}
          >
            <Printer size={14} />
            {ready ? "Print" : `Loading ${loaded} / ${certs.length}…`}
          </button>
          {nextHref && (
            <Link href={nextHref} className="text-sm font-medium" style={{ color: "var(--ct-blue)" }}>
              Print next {Math.min(50, total - rangeEnd)} &rarr;
            </Link>
          )}
        </div>

        <p className="text-sm flex items-center gap-2" style={{ color: "var(--ct-text-2)" }}>
          {certs.length === 0
            ? "There are no certificates to print."
            : `Showing certificates ${rangeStart}–${rangeEnd} of ${total}. One certificate per page, A4 landscape.`}
          {certs.length > 0 && (
            <InfoTip width={320}>
              Download PDF saves a file you can print later or send to a print shop, with no date or web address on the page.
              Print sends this page straight to your printer; in the print window, untick &ldquo;Headers and footers&rdquo; so the date and address don&apos;t appear.
              {total > 50 && " Large jobs are split into groups of 50 so they stay fast. Use \u201cPrint next\u201d to continue; each group has its own PDF."}
            </InfoTip>
          )}
        </p>
        {skipped > 0 && (
          <p className="text-xs" style={{ color: "#FCD34D" }}>
            {skipped} certificate{skipped === 1 ? " was" : "s were"} skipped because {skipped === 1 ? "it hasn't" : "they haven't"} been generated yet.
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-6 px-8 pb-8 print:gap-0 print:p-0">
        {certs.map(({ certId: id, src }) => (
          <div
            key={id}
            className="print-page flex items-center justify-center bg-white"
            style={{ width: "100%", maxWidth: 1123, aspectRatio: "297 / 210" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Certificate ${id}`}
              loading="eager"
              ref={(el) => { if (el?.complete) markLoaded(id) }}
              onLoad={() => markLoaded(id)}
              onError={() => markLoaded(id)}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
