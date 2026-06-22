import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createBill } from "@/lib/toyyibpay"
import { TIERS, type TierKey } from "@/lib/tiers"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { tier } = (await req.json()) as { tier?: TierKey }
  const targetTier = TIERS.find(t => t.key === tier)
  if (!targetTier) return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
  if (targetTier.key === "ENTERPRISE" || targetTier.price === null) {
    return NextResponse.json({ error: "Contact sales for this tier" }, { status: 400 })
  }

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
    select: { organizerCd: true, tier: true },
  })
  if (!organizer) return NextResponse.json({ error: "Organizer not found" }, { status: 404 })

  const currentIndex = TIERS.findIndex(t => t.key === organizer.tier)
  const targetIndex = TIERS.findIndex(t => t.key === targetTier.key)
  if (targetIndex <= currentIndex) {
    return NextResponse.json({ error: "Use the downgrade endpoint for this tier change" }, { status: 400 })
  }

  const billcode = `BILL-${Date.now()}-${organizer.organizerCd}`

  let transactionId: number
  try {
    const txn = await prisma.paymentTransaction.create({
      data: {
        userId: session.user.id,
        billcode,
        amount: targetTier.price,
        tierRequested: targetTier.key,
        certQuotaReq: targetTier.quota,
        status: "PENDING",
      },
    })
    transactionId = txn.id
  } catch (err) {
    console.error("[billing/checkout] failed to create transaction:", err)
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 })
  }

  try {
    const { paymentUrl } = await createBill({
      billcode,
      amount: targetTier.price,
      tierRequested: targetTier.key,
      userId: session.user.id,
    })
    return NextResponse.json({ paymentUrl })
  } catch (err) {
    await prisma.paymentTransaction.delete({ where: { id: transactionId } }).catch(() => {})
    console.error("[billing/checkout] createBill failed:", err)
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 })
  }
}
