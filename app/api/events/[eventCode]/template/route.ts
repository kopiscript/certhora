import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Props { params: Promise<{ eventCode: string }> }

// ─── GET — fetch template for event ──────────────────────────────────────────

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
    include: { template: true },
  })
  if (!event || event.organizerCd !== organizer.organizerCd) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(event.template ?? null)
}

// ─── PUT — update template for event ─────────────────────────────────────────

export async function PUT(req: Request, { params }: Props) {
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
    select: { organizerCd: true },
  })
  if (!event || event.organizerCd !== organizer.organizerCd) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const template = await prisma.template.upsert({
    where: { eventCode },
    update: {
      imageUrl:     body.imageUrl     as string | null,
      primaryColor: body.primaryColor as string | undefined,
      nameCenterX:  body.nameCenterX  as number | undefined,
      nameY:        body.nameY        as number | undefined,
      nameMaxWidth: body.nameMaxWidth as number | undefined,
      nameFontSize: body.nameFontSize as number | undefined,
      nameFont:     body.nameFont     as string | undefined,
      nameColor:    body.nameColor    as string | undefined,
      qrX:          body.qrX         as number | undefined,
      qrY:          body.qrY         as number | undefined,
      qrSize:       body.qrSize       as number | undefined,
      certIdFont:   body.certIdFont   as string | undefined,
      certIdColor:  body.certIdColor  as string | undefined,
      showWatermark: body.showWatermark as boolean | undefined,
      additional:   body.additional as never,
    },
    create: {
      eventCode,
      imageUrl:     body.imageUrl     as string | null ?? null,
      primaryColor: body.primaryColor as string ?? "#1D4ED8",
      nameCenterX:  body.nameCenterX  as number ?? 600,
      nameY:        body.nameY        as number ?? 340,
      nameMaxWidth: body.nameMaxWidth as number ?? 840,
      nameFontSize: body.nameFontSize as number ?? 52,
      nameFont:     body.nameFont     as string ?? "Arial, Helvetica, sans-serif",
      nameColor:    body.nameColor    as string ?? "#1E293B",
      qrX:          body.qrX         as number ?? 1010,
      qrY:          body.qrY         as number ?? 628,
      qrSize:       body.qrSize       as number ?? 140,
      certIdFont:   body.certIdFont   as string ?? "monospace",
      certIdColor:  body.certIdColor  as string ?? "#64748B",
      showWatermark: body.showWatermark as boolean ?? false,
      additional:   (body.additional ?? []) as never,
    },
  })

  return NextResponse.json(template)
}
