import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Props { params: Promise<{ eventCode: string }> }

export async function GET(_req: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { eventCode } = await params

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
    select: { organizerCd: true },
  })
  if (!organizer) return NextResponse.json({ error: "Organizer not found" }, { status: 404 })

  const event = await prisma.event.findUnique({
    where: { eventCode },
    include: {
      template: true,
      certificates: {
        orderBy: { createdAt: "asc" },
        select: {
          certId: true,
          participantName: true,
          participantEmail: true,
          emailStatus: true,
          createdAt: true,
          viewCount: true,
          shareCount: true,
        },
      },
      _count: { select: { certificates: true, feedback: true } },
    },
  })

  if (!event || event.organizerCd !== organizer.organizerCd) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  return NextResponse.json(event)
}

export async function PATCH(req: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { eventCode } = await params

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
    select: { organizerCd: true },
  })
  if (!organizer) return NextResponse.json({ error: "Organizer not found" }, { status: 404 })

  const event = await prisma.event.findUnique({ where: { eventCode } })
  if (!event || event.organizerCd !== organizer.organizerCd) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const updated = await prisma.event.update({
    where: { eventCode },
    data: {
      eventName:   typeof body.eventName === "string"   ? body.eventName.trim()   : undefined,
      templateId:  typeof body.templateId === "string"  ? body.templateId         : undefined,
      status:      typeof body.status === "string"      ? (body.status as never)  : undefined,
      eventDate:   body.eventDate   ? new Date(body.eventDate as string)   : undefined,
      expiryDate:  body.expiryDate  ? new Date(body.expiryDate as string)  : undefined,
      description: typeof body.description === "string" ? body.description.trim() : undefined,
      skills:      Array.isArray(body.skills)           ? body.skills             : undefined,
    },
  })

  return NextResponse.json(updated)
}
