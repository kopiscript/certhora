export const dynamic = "force-dynamic"

import { notFound, redirect } from "next/navigation"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { getCurrentSession, getCurrentOrganizer } from "@/lib/session"
import { TIERS, normalizeTierKey } from "@/lib/tiers"
import PrintButton from "./PrintButton"

interface Props {
  params: Promise<{ id: string }>
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CARD: "Credit/Debit Card",
  FPX: "FPX Online Banking",
}

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "long", year: "numeric" }).format(d)
}

export default async function ReceiptPage({ params }: Props) {
  const { id } = await params
  const txnId = Number(id)
  if (!Number.isInteger(txnId)) notFound()

  const session = await getCurrentSession()
  if (!session) redirect("/login")

  const organizer = await getCurrentOrganizer(session.user.id)
  if (!organizer) redirect("/login")

  const txn = await prisma.paymentTransaction.findUnique({ where: { id: txnId } })
  if (!txn || txn.userId !== session.user.id) notFound()

  const tier = TIERS.find(t => t.key === normalizeTierKey(txn.tierRequested))
  const payorName = `${txn.payorFirstName} ${txn.payorLastName}`.trim()

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", padding: "40px 16px", display: "flex", justifyContent: "center" }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt, #receipt * { visibility: visible; }
          #receipt { position: absolute; inset: 0; box-shadow: none !important; border: none !important; }
          #no-print { display: none !important; }
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 640 }}>
        <div id="no-print" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <PrintButton />
        </div>

        <div id="receipt" style={{
          background: "#fff", color: "#1E293B", borderRadius: 14,
          border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          padding: "40px 44px",
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 24, borderBottom: "2px solid #1E293B" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Image src="/certhoralogo.png" alt="Certhora" width={36} height={36} />
              <div>
                <p style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em" }}>Certhora</p>
                <p style={{ fontSize: 11, color: "#64748B" }}>certhora.com &middot; support@certhora.com</p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 20, fontWeight: 800, letterSpacing: "0.04em", color: "#0F172A" }}>RECEIPT</p>
              <p style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{fmtDate(txn.createdAt)}</p>
            </div>
          </div>

          {/* Bill to / Receipt meta */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, padding: "24px 0", borderBottom: "1px solid #E2E8F0" }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#94A3B8", marginBottom: 6 }}>BILLED TO</p>
              <p style={{ fontSize: 13, fontWeight: 600 }}>{organizer.orgName}</p>
              {payorName && <p style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{payorName}</p>}
              {txn.payorEmail && <p style={{ fontSize: 12, color: "#475569" }}>{txn.payorEmail}</p>}
              {txn.payorPhone && <p style={{ fontSize: 12, color: "#475569" }}>{txn.payorPhone}</p>}
              {txn.payorCountry && <p style={{ fontSize: 12, color: "#475569" }}>{txn.payorCountry}</p>}
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#94A3B8", marginBottom: 6 }}>RECEIPT DETAILS</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12 }}>
                <span><span style={{ color: "#94A3B8" }}>Receipt No: </span>{txn.billcode}</span>
                {txn.refno && <span><span style={{ color: "#94A3B8" }}>Reference No: </span>{txn.refno}</span>}
                <span><span style={{ color: "#94A3B8" }}>Payment Method: </span>{PAYMENT_METHOD_LABEL[txn.paymentMethod] ?? txn.paymentMethod}</span>
                <span><span style={{ color: "#94A3B8" }}>Status: </span>{txn.status}</span>
              </div>
            </div>
          </div>

          {/* Line item */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ textAlign: "left", padding: "0 0 8px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#94A3B8" }}>DESCRIPTION</th>
                <th style={{ textAlign: "right", padding: "0 0 8px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#94A3B8" }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "12px 0", fontSize: 13 }}>
                  {tier?.name ?? txn.tierRequested} Plan subscription
                  <span style={{ display: "block", fontSize: 11, color: "#64748B", marginTop: 2 }}>
                    {txn.certQuotaReq.toLocaleString()} certificates / month
                  </span>
                </td>
                <td style={{ padding: "12px 0", fontSize: 13, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  RM {Number(txn.amount).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Total */}
          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 16, borderTop: "2px solid #1E293B", marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Total Paid</span>
              <span style={{ fontSize: 20, fontWeight: 800 }}>RM {Number(txn.amount).toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 36, paddingTop: 16, borderTop: "1px solid #E2E8F0", textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#94A3B8" }}>
              This is a computer-generated receipt issued by Certhora and does not require a signature.
            </p>
            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>
              Questions about this charge? Contact admin@certhora.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
