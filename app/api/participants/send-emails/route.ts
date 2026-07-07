import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendQueuedCertificates } from "@/lib/send-certificates"

const BATCH_CAP = 20

// Sends a manually-selected set of certs, which may span multiple events —
// unlike /api/events/[eventCode]/send-emails, which is single-event scoped.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
    select: { organizerCd: true },
  })
  if (!organizer) return NextResponse.json({ error: "Organizer not found" }, { status: 404 })

  let body: { certIds: string[] }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { certIds } = body
  if (!Array.isArray(certIds) || certIds.length === 0) {
    return NextResponse.json({ error: "certIds array is required" }, { status: 400 })
  }

  const result = await sendQueuedCertificates(
    { certId: { in: certIds }, event: { organizerCd: organizer.organizerCd } },
    BATCH_CAP
  )
  return NextResponse.json(result)
}
