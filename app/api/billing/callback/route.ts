import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? ""
  const fields = contentType.includes("application/json")
    ? await req.json()
    : Object.fromEntries(new URLSearchParams(await req.text()))

  const billcode = fields.billcode as string | undefined
  const status = fields.status as string | undefined // "SUCCESS" | "FAILED" — toyyibpay sends status_id (1=success) in real mode
  const refno = (fields.refno as string | undefined) ?? null

  if (!billcode || !status) {
    return NextResponse.json({ error: "Missing billcode or status" }, { status: 400 })
  }

  const txn = await prisma.paymentTransaction.findFirst({ where: { billcode } })
  if (!txn) return NextResponse.json({ error: "Transaction not found" }, { status: 404 })

  // Webhook may retry — already-resolved transactions are a no-op.
  if (txn.status !== "PENDING") return NextResponse.json({ ok: true })

  if (status !== "SUCCESS") {
    await prisma.paymentTransaction.update({
      where: { id: txn.id },
      data: { status: "FAILED" },
    })
    return NextResponse.json({ ok: true })
  }

  await prisma.paymentTransaction.update({
    where: { id: txn.id },
    data: { status: "SUCCESS", refno },
  })

  const organizer = await prisma.organizer.findUnique({
    where: { userId: txn.userId },
    select: { organizerCd: true, subscribeDate: true },
  })
  if (!organizer) return NextResponse.json({ ok: true })

  const now = new Date()
  const expiryDate = new Date(now)
  expiryDate.setMonth(expiryDate.getMonth() + 1)

  await prisma.organizer.update({
    where: { organizerCd: organizer.organizerCd },
    data: {
      tier: txn.tierRequested,
      certQuota: txn.certQuotaReq,
      expiryDate,
      subscribeDate: organizer.subscribeDate ?? now,
      pendingTier: null,
      pendingCertQuota: null,
      pendingEffectiveDate: null,
    },
  })

  await prisma.subscription.upsert({
    where: { organizerCd: organizer.organizerCd },
    create: { organizerCd: organizer.organizerCd, tier: txn.tierRequested, certQuota: txn.certQuotaReq },
    update: { tier: txn.tierRequested, certQuota: txn.certQuotaReq, suspendDate: null },
  })

  return NextResponse.json({ ok: true })
}
