import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ─── Generate unique event code ───────────────────────────────────────────────

async function generateEventCode(orgCd: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `${orgCd.toUpperCase()}${year}` // e.g. "GDG2026"

  if (!await prisma.event.findUnique({ where: { eventCode: prefix } })) return prefix

  for (let i = 0; i < 26; i++) {
    const code = `${prefix}${String.fromCharCode(65 + i)}` // "GDG2026A", "GDG2026B"…
    if (!await prisma.event.findUnique({ where: { eventCode: code } })) return code
  }

  throw new Error("Cannot generate a unique event code for this organizer and year")
}

// ─── GET — list events ────────────────────────────────────────────────────────

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
    select: { organizerCd: true },
  })
  if (!organizer) return NextResponse.json({ error: "Organizer not found" }, { status: 404 })

  const events = await prisma.event.findMany({
    where: { organizerCd: organizer.organizerCd },
    orderBy: { createdAt: "desc" },
    include: {
      template: { select: { name: true, imageUrl: true } },
      _count: {
        select: {
          certificates: true,
        },
      },
    },
  })

  // Attach per-status counts
  const enriched = await Promise.all(
    events.map(async (e) => {
      const [pending, queued, sent] = await Promise.all([
        prisma.certificate.count({ where: { eventCode: e.eventCode, emailStatus: "PENDING" } }),
        prisma.certificate.count({ where: { eventCode: e.eventCode, emailStatus: "QUEUED" } }),
        prisma.certificate.count({ where: { eventCode: e.eventCode, emailStatus: "SENT" } }),
      ])
      return { ...e, stats: { pending, queued, sent, total: e._count.certificates } }
    })
  )

  return NextResponse.json(enriched)
}

// ─── POST — create event + participants ───────────────────────────────────────

interface CreateEventBody {
  eventName: string
  templateId?: string
  eventDate?: string
  expiryDate?: string
  description?: string
  skills?: string[]
  participants: Array<{ name: string; email: string }>
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
    select: { organizerCd: true },
  })
  if (!organizer) return NextResponse.json({ error: "Organizer not found" }, { status: 404 })

  let body: CreateEventBody
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { eventName, templateId, eventDate, expiryDate, description, skills, participants } = body

  if (!eventName?.trim()) {
    return NextResponse.json({ error: "eventName is required" }, { status: 400 })
  }
  if (!Array.isArray(participants) || participants.length === 0) {
    return NextResponse.json({ error: "At least one participant is required" }, { status: 400 })
  }

  // Validate template ownership if provided
  if (templateId) {
    const tpl = await prisma.template.findUnique({ where: { id: templateId } })
    if (!tpl || tpl.organizerCd !== organizer.organizerCd) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }
  }

  const eventCode = await generateEventCode(organizer.organizerCd)

  // Build cert IDs: [orgCd][4-digit random], check for collisions in batch
  const prefix = organizer.organizerCd.toUpperCase()
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
  if (certIds.length < participants.length) {
    return NextResponse.json({ error: "Could not generate unique cert IDs" }, { status: 500 })
  }

  const event = await prisma.$transaction(async (tx) => {
    const ev = await tx.event.create({
      data: {
        eventCode,
        eventName: eventName.trim(),
        templateId: templateId ?? null,
        status: "DRAFT",
        eventDate: eventDate ? new Date(eventDate) : null,
        issuedDate: new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        description: description?.trim() ?? null,
        skills: skills ?? [],
        organizerCd: organizer.organizerCd,
      },
    })

    await tx.certificate.createMany({
      data: participants.map((p, i) => ({
        certId: certIds[i],
        participantName: p.name.trim(),
        participantEmail: p.email.trim().toLowerCase(),
        eventCode,
        emailStatus: "PENDING",
      })),
    })

    return ev
  })

  return NextResponse.json(
    { eventCode: event.eventCode, participantCount: participants.length },
    { status: 201 }
  )
}
