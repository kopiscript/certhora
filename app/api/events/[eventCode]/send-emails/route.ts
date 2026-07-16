import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendQueuedCertificates } from "@/lib/send-certificates"
import { tierCanEmailParticipants } from "@/lib/tiers"

const BATCH_CAP = 20

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ eventCode: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { eventCode } = await params

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
    select: { organizerCd: true, tier: true },
  })
  if (!organizer) return NextResponse.json({ error: "Organizer not found" }, { status: 404 })
  if (!tierCanEmailParticipants(organizer.tier)) {
    return NextResponse.json({ error: "Email delivery is available on the Pro plan only" }, { status: 403 })
  }

  const event = await prisma.event.findUnique({
    where: { eventCode },
    select: { organizerCd: true, tier: true },
  })
  if (!event || event.organizerCd !== organizer.organizerCd) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  const result = await sendQueuedCertificates({ eventCode }, BATCH_CAP)
  return NextResponse.json(result)
}



