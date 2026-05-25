import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ─── Generate unique event code ───────────────────────────────────────────────

async function generateEventCode(orgCd: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `${orgCd.toUpperCase()}${year}`

  if (!await prisma.event.findUnique({ where: { eventCode: prefix } })) return prefix

  for (let i = 0; i < 26; i++) {
    const code = `${prefix}${String.fromCharCode(65 + i)}`
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
      template: { select: { imageUrl: true, primaryColor: true } },
      _count: { select: { certificates: true } },
    },
  })

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

// ─── POST — create event + template ──────────────────────────────────────────

interface TemplateInput {
  imageUrl?: string | null
  primaryColor?: string
  nameCenterX?: number
  nameY?: number
  nameMaxWidth?: number
  nameFontSize?: number
  nameFont?: string
  nameColor?: string
  qrX?: number
  qrY?: number
  qrSize?: number
  certIdFont?: string
  certIdColor?: string
  showWatermark?: boolean
  additional?: unknown
}

interface CreateEventBody {
  eventName: string
  eventDate?: string
  expiryDate?: string
  description?: string
  skills?: string[]
  hasBadge?: boolean
  participants?: Array<{ name: string; email: string }>
  template?: TemplateInput
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

  const { eventName, eventDate, expiryDate, description, skills, hasBadge, participants, template } = body

  if (!eventName?.trim()) {
    return NextResponse.json({ error: "eventName is required" }, { status: 400 })
  }

  const eventCode = await generateEventCode(organizer.organizerCd)

  const event = await prisma.$transaction(async (tx) => {
    const ev = await tx.event.create({
      data: {
        eventCode,
        eventName: eventName.trim(),
        status: "DRAFT",
        hasBadge: hasBadge ?? false,
        eventDate: eventDate ? new Date(eventDate) : null,
        issuedDate: new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        description: description?.trim() ?? null,
        skills: skills ?? [],
        organizerCd: organizer.organizerCd,
      },
    })

    // Create template with provided layout or defaults
    await tx.template.create({
      data: {
        eventCode,
        imageUrl:     template?.imageUrl     ?? null,
        primaryColor: template?.primaryColor ?? "#1D4ED8",
        nameCenterX:  template?.nameCenterX  ?? 600,
        nameY:        template?.nameY        ?? 340,
        nameMaxWidth: template?.nameMaxWidth ?? 840,
        nameFontSize: template?.nameFontSize ?? 52,
        nameFont:     template?.nameFont     ?? "Arial, Helvetica, sans-serif",
        nameColor:    template?.nameColor    ?? "#1E293B",
        qrX:          template?.qrX         ?? 1010,
        qrY:          template?.qrY         ?? 628,
        qrSize:       template?.qrSize       ?? 140,
        certIdFont:   template?.certIdFont   ?? "monospace",
        certIdColor:  template?.certIdColor  ?? "#64748B",
        showWatermark: template?.showWatermark ?? false,
        additional:   template?.additional   ?? [],
      },
    })

    // Optionally create participants if provided
    if (Array.isArray(participants) && participants.length > 0) {
      const prefix = organizer.organizerCd.toUpperCase()
      const existing = await tx.certificate.findMany({
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
        throw new Error("Could not generate unique cert IDs")
      }

      await tx.certificate.createMany({
        data: participants.map((p, i) => ({
          certId: certIds[i],
          participantName: p.name.trim(),
          participantEmail: p.email.trim().toLowerCase(),
          eventCode,
          emailStatus: "PENDING",
        })),
      })
    }

    return ev
  })

  return NextResponse.json(
    { eventCode: event.eventCode, participantCount: participants?.length ?? 0 },
    { status: 201 }
  )
}
