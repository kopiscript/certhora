import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendQueuedCertificates } from "@/lib/send-certificates"
import { generatePendingCertificates } from "@/lib/generate-certificates"
import { tierCanEmailParticipants } from "@/lib/tiers"

const BATCH_CAP = 20

// Sends a manually-selected set of certs, which may span multiple events —
// unlike /api/events/[eventCode]/send-emails, which is single-event scoped.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
    select: { organizerCd: true, tier: true },
  })
  if (!organizer) return NextResponse.json({ error: "Organizer not found" }, { status: 404 })
  if (!tierCanEmailParticipants(organizer.tier)) {
    return NextResponse.json({ error: "Email delivery is available on the Pro plan only" }, { status: 403 })
  }

  let body: { certIds: string[] }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { certIds } = body
  if (!Array.isArray(certIds) || certIds.length === 0) {
    return NextResponse.json({ error: "certIds array is required" }, { status: 400 })
  }

  // Auto-generate any selected certs that haven't been generated yet, so
  // organizers don't have to click "Generate Certificates" before sending.
  const pendingEvents = await prisma.certificate.findMany({
    where: { certId: { in: certIds }, emailStatus: "PENDING", event: { organizerCd: organizer.organizerCd } },
    select: { eventCode: true },
    distinct: ["eventCode"],
  })
  const generateErrors: string[] = []
  for (const { eventCode } of pendingEvents) {
    const outcome = await generatePendingCertificates(eventCode, organizer.organizerCd)
    if (outcome.error) generateErrors.push(`${eventCode}: ${outcome.error}`)
  }

  const result = await sendQueuedCertificates(
    { certId: { in: certIds }, event: { organizerCd: organizer.organizerCd } },
    BATCH_CAP
  )
  return NextResponse.json({ ...result, generateErrors })
}



