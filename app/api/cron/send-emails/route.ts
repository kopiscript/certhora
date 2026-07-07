import { NextResponse } from "next/server"
import { sendQueuedCertificates } from "@/lib/send-certificates"

// Drains any QUEUED certificates left over after the per-event send cap,
// across all organizers/events. Not host-specific — any scheduler can call
// this as long as it sends `Authorization: Bearer <CRON_SECRET>`.
const BATCH_CAP = 20

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await sendQueuedCertificates({}, BATCH_CAP)
  return NextResponse.json(result)
}
