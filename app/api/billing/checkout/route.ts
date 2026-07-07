import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createBill } from "@/lib/billplz"
import { TIERS, type TierKey } from "@/lib/tiers"
import type { PaymentMethod } from "@prisma/client"

interface CheckoutBody {
  tier?: TierKey
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  country?: string
  paymentMethod?: PaymentMethod
  agreeTerms?: boolean
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await req.json()) as CheckoutBody
  const { tier, firstName, lastName, email, phone, country, paymentMethod, agreeTerms } = body

  const targetTier = TIERS.find(t => t.key === tier)
  if (!targetTier || targetTier.price === null) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
  }

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim() || !country?.trim()) {
    return NextResponse.json({ error: "Missing required payment details" }, { status: 400 })
  }
  if (paymentMethod !== "CARD" && paymentMethod !== "FPX") {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 })
  }
  if (!agreeTerms) {
    return NextResponse.json({ error: "You must agree to the Terms and Privacy Policy" }, { status: 400 })
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
        paymentMethod,
        payorFirstName: firstName.trim(),
        payorLastName: lastName.trim(),
        payorEmail: email.trim(),
        payorPhone: phone.trim(),
        payorCountry: country.trim(),
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
      paymentMethod,
      payorFirstName: firstName.trim(),
      payorLastName: lastName.trim(),
      payorEmail: email.trim(),
      payorPhone: phone.trim(),
    })
    return NextResponse.json({ paymentUrl })
  } catch (err) {
    await prisma.paymentTransaction.delete({ where: { id: transactionId } }).catch(() => {})
    console.error("[billing/checkout] createBill failed:", err)
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 })
  }
}
