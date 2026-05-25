import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Props { params: Promise<{ eventCode: string }> }

async function getOwnedEvent(eventCode: string, userId: string) {
  const organizer = await prisma.organizer.findUnique({
    where: { userId },
    select: { organizerCd: true },
  })
  if (!organizer) return null
  const event = await prisma.event.findUnique({ where: { eventCode } })
  if (!event || event.organizerCd !== organizer.organizerCd) return null
  return { event, organizer }
}

export async function GET(_req: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { eventCode } = await params
  const result = await getOwnedEvent(eventCode, session.user.id)
  if (!result) return NextResponse.json({ error: "Event not found" }, { status: 404 })

  const certs = await prisma.certificate.findMany({
    where: { eventCode },
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
  })

  return NextResponse.json(certs)
}

export async function POST(req: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { eventCode } = await params
  const result = await getOwnedEvent(eventCode, session.user.id)
  if (!result) return NextResponse.json({ error: "Event not found" }, { status: 404 })

  let body: { participants: Array<{ name: string; email: string }> }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { participants } = body
  if (!Array.isArray(participants) || participants.length === 0) {
    return NextResponse.json({ error: "participants array is required" }, { status: 400 })
  }

  const prefix = result.organizer.organizerCd.toUpperCase()
  const existing = await prisma.certificate.findMany({
    where: { certId: { startsWith: prefix } },
    select: { certId: true },
  })
  const existingSet = new Set(existing.map(r => r.certId))

  const certIds: string[] = []
  let attempts = 0
  while (certIds.length < participants.length && attempts < participants.length * 20) {
    const id = `${prefix}${String(Math.floor(1000 + Math.random() * 9000))}`
    if (!existingSet.has(id) && !certIds.includes(id)) {
      certIds.push(id)
      existingSet.add(id)
    }
    attempts++
  }

  await prisma.certificate.createMany({
    data: participants.map((p, i) => ({
      certId: certIds[i],
      participantName: p.name.trim(),
      participantEmail: p.email.trim().toLowerCase(),
      eventCode,
      emailStatus: "PENDING" as const,
    })),
  })

  return NextResponse.json({ added: participants.length }, { status: 201 })
}
