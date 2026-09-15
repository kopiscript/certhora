import { NextRequest, NextResponse } from "next/server"
import { sendQueuedCertificates } from "@/lib/send-certificates"

// Vercel Cron hits this once daily (see vercel.json) to drain whatever's left
// in the send queue after the platform-wide 80/day cap (lib/send-certificates.ts)
// resets. Organizer-triggered sends still work independently the rest of the
// day — this just picks up slack nobody manually sent.
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Only Pro organizers can have participant emails sent, same rule as the
  // organizer-triggered routes (app/api/events/[eventCode]/send-emails etc).
  const result = await sendQueuedCertificates({ event: { organizer: { tier: "PRO" } } }, 80)

  return NextResponse.json(result)
}
