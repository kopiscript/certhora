export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { TIERS } from "@/lib/tiers"
import MockPayActions from "./MockPayActions"

interface Props {
  params: Promise<{ billcode: string }>
}

export default async function MockPayPage({ params }: Props) {
  const { billcode } = await params

  const txn = await prisma.paymentTransaction.findFirst({ where: { billcode } })
  if (!txn) notFound()

  const tier = TIERS.find(t => t.key === txn.tierRequested)

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0B0E14", padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 380, background: "var(--card, #11151D)",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 28,
      }}>
        <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748B" }}>
          Mock toyyibpay Checkout
        </p>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginTop: 6 }}>
          {tier?.name ?? txn.tierRequested} Plan
        </h1>
        <p style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginTop: 10 }}>
          RM {Number(txn.amount).toFixed(2)}
        </p>
        <p style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
          Bill code: {billcode}
        </p>
        <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 16, lineHeight: 1.5 }}>
          toyyibpay isn&apos;t configured for this environment, so this page simulates the
          payment outcome instead of redirecting to a real checkout.
        </p>
        <MockPayActions billcode={billcode} />
      </div>
    </div>
  )
}
