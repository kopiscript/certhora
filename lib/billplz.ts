import "server-only"
import type { TierKey } from "@/lib/tiers"
import type { PaymentMethod } from "@prisma/client"

interface CreateBillParams {
  billcode: string
  amount: number
  tierRequested: TierKey
  userId: string
  paymentMethod: PaymentMethod
  payorFirstName: string
  payorLastName: string
  payorEmail: string
  payorPhone: string
}

interface CreateBillResult {
  paymentUrl: string
}

function baseUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000"
}

async function createBillMock({ billcode }: CreateBillParams): Promise<CreateBillResult> {
  console.warn(
    "[billplz] BILLPLZ_API_KEY not set — using mock checkout. Set BILLPLZ_API_KEY, BILLPLZ_COLLECTION_ID and BILLPLZ_URL to enable real payments."
  )
  return { paymentUrl: `${baseUrl()}/billing/mock-pay/${billcode}` }
}

// Billplz's "method" param restricts the hosted checkout page to a single
// payment gateway instead of showing every channel the collection supports.
const BILLPLZ_METHOD: Record<PaymentMethod, string> = {
  CARD: "card",
  FPX: "fpx",
}

async function createBillReal(params: CreateBillParams): Promise<CreateBillResult> {
  const apiKey = process.env.BILLPLZ_API_KEY
  const collectionId = process.env.BILLPLZ_COLLECTION_ID
  const apiUrl = process.env.BILLPLZ_URL // e.g. https://www.billplz.com/api/v3/ (or the sandbox host)
  if (!apiKey || !collectionId || !apiUrl) {
    throw new Error("[billplz] BILLPLZ_API_KEY, BILLPLZ_COLLECTION_ID or BILLPLZ_URL not set")
  }

  const { billcode, amount, tierRequested, payorFirstName, payorLastName, payorEmail, payorPhone, paymentMethod } = params

  const body = new URLSearchParams({
    collection_id: collectionId,
    email: payorEmail,
    mobile: payorPhone,
    name: `${payorFirstName} ${payorLastName}`,
    amount: String(Math.round(amount * 100)),
    description: `Certhora ${tierRequested} plan upgrade`,
    callback_url: `${baseUrl()}/api/billing/callback`,
    redirect_url: `${baseUrl()}/dashboard/billing`,
    reference_1_label: "Bill Code",
    reference_1: billcode,
    method: BILLPLZ_METHOD[paymentMethod],
  })

  const res = await fetch(new URL("bills", apiUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
    },
    body,
  })
  if (!res.ok) throw new Error(`[billplz] createBill failed: HTTP ${res.status}`)

  const data = await res.json()
  const billId = data?.id
  if (!billId) throw new Error(`[billplz] createBill returned no id: ${JSON.stringify(data)}`)

  return { paymentUrl: new URL(`/bills/${billId}`, apiUrl).toString() }
}

export async function createBill(params: CreateBillParams): Promise<CreateBillResult> {
  return process.env.BILLPLZ_API_KEY ? createBillReal(params) : createBillMock(params)
}
