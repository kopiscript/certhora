import "server-only"
import type { TierKey } from "@/lib/tiers"

interface CreateBillParams {
  billcode: string
  amount: number
  tierRequested: TierKey
  userId: string
}

interface CreateBillResult {
  paymentUrl: string
}

function baseUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000"
}

async function createBillMock({ billcode }: CreateBillParams): Promise<CreateBillResult> {
  console.warn(
    "[toyyibpay] TOYYIBPAY_SECRET_KEY not set — using mock checkout. Set TOYYIBPAY_SECRET_KEY and TOYYIBPAY_CATEGORY_CODE to enable real payments."
  )
  return { paymentUrl: `${baseUrl()}/billing/mock-pay/${billcode}` }
}

async function createBillReal({ billcode, amount, tierRequested }: CreateBillParams): Promise<CreateBillResult> {
  const secretKey = process.env.TOYYIBPAY_SECRET_KEY
  const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE
  if (!secretKey || !categoryCode) throw new Error("[toyyibpay] TOYYIBPAY_SECRET_KEY or TOYYIBPAY_CATEGORY_CODE not set")

  const body = new URLSearchParams({
    userSecretKey: secretKey,
    categoryCode,
    billName: `Certhora ${tierRequested} subscription`,
    billDescription: `Certhora ${tierRequested} plan upgrade`,
    billPriceSetting: "1",
    billPayorInfo: "1",
    billAmount: String(Math.round(amount * 100)),
    billExternalReferenceNo: billcode,
    billReturnUrl: `${baseUrl()}/dashboard/billing`,
    billCallbackUrl: `${baseUrl()}/api/billing/callback`,
    billPaymentChannel: "0",
  })

  const res = await fetch("https://toyyibpay.com/index.php/api/createBill", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  if (!res.ok) throw new Error(`[toyyibpay] createBill failed: HTTP ${res.status}`)

  const data = await res.json()
  const billCode = data?.[0]?.BillCode
  if (!billCode) throw new Error(`[toyyibpay] createBill returned no BillCode: ${JSON.stringify(data)}`)

  return { paymentUrl: `https://toyyibpay.com/${billCode}` }
}

export async function createBill(params: CreateBillParams): Promise<CreateBillResult> {
  return process.env.TOYYIBPAY_SECRET_KEY ? createBillReal(params) : createBillMock(params)
}
