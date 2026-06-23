import { NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { prisma } from "@/lib/prisma"

// Billplz signs callbacks with: sort all fields except x_signature by key (ascending),
// concatenate as `${key}${value}` with "|" between pairs, then HMAC-SHA256 hex with the
// collection's X-Signature key. Mismatches are rejected outright.
function verifyBillplzSignature(fields: Record<string, unknown>): boolean {
  const signatureKey = process.env.BILLPLZ_X_SIGNATURE_KEY
  if (!signatureKey) return true // not configured — nothing to verify against

  const signature = fields.x_signature as string | undefined
  if (!signature) return false

  const sourceText = Object.keys(fields)
    .filter(k => k !== "x_signature")
    .sort()
    .map(k => `${k}${fields[k]}`)
    .join("|")

  const expected = createHmac("sha256", signatureKey).update(sourceText).digest("hex")
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? ""
  const fields = contentType.includes("application/json")
    ? await req.json()
    : Object.fromEntries(new URLSearchParams(await req.text()))

  // Mock checkout (lib/billplz.ts mock mode) posts {billcode, status, refno} directly.
  // Real Billplz webhooks post {id, reference_1, paid, paid_amount, ...} instead — reference_1
  // carries our billcode since Billplz has no concept of an external reference of its own.
  const isBillplzWebhook = fields.id !== undefined && fields.reference_1 !== undefined

  if (isBillplzWebhook && !verifyBillplzSignature(fields)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const billcode = (isBillplzWebhook ? fields.reference_1 : fields.billcode) as string | undefined
  const status = isBillplzWebhook
    ? (fields.paid === "true" || fields.paid === true ? "SUCCESS" : "FAILED")
    : (fields.status as string | undefined)
  const refno = isBillplzWebhook ? ((fields.id as string | undefined) ?? null) : ((fields.refno as string | undefined) ?? null)

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
