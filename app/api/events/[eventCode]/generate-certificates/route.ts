import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generatePendingCertificates } from "@/lib/generate-certificates"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ eventCode: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { eventCode } = await params

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
    select: { organizerCd: true },
  })
  if (!organizer) return NextResponse.json({ error: "Organizer not found" }, { status: 404 })

  const event = await prisma.event.findUnique({ where: { eventCode }, select: { organizerCd: true } })
  if (!event || event.organizerCd !== organizer.organizerCd) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  const pendingCount = await prisma.certificate.count({ where: { eventCode, emailStatus: "PENDING" } })
  if (pendingCount === 0) {
    return NextResponse.json({ error: "No pending participants for this event" }, { status: 404 })
  }

  const outcome = await generatePendingCertificates(eventCode, organizer.organizerCd)
  if (outcome.error) {
    const status = outcome.error.startsWith("Quota exceeded") ? 422 : 400
    return NextResponse.json({ error: outcome.error }, { status })
  }

  return NextResponse.json({
    success: true,
    eventCode,
    generated: outcome.generated,
    results: outcome.results,
  })
}
