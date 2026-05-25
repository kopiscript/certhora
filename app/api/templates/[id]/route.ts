import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Props { params: Promise<{ id: string }> }

async function resolveOwner(templateId: string, userId: string) {
  const organizer = await prisma.organizer.findUnique({
    where: { userId },
    select: { organizerCd: true },
  })
  if (!organizer) return null

  const template = await prisma.template.findUnique({ where: { id: templateId } })
  if (!template || template.organizerCd !== organizer.organizerCd) return null
  return { template, organizer }
}

export async function GET(_req: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const result = await resolveOwner(id, session.user.id)
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(result.template)
}

export async function PUT(req: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const result = await resolveOwner(id, session.user.id)
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const updated = await prisma.template.update({
    where: { id },
    data: {
      name:         typeof body.name === "string"         ? body.name.trim()       : undefined,
      imageUrl:     typeof body.imageUrl === "string"     ? body.imageUrl          : undefined,
      primaryColor: typeof body.primaryColor === "string" ? body.primaryColor      : undefined,
      nameCenterX:  body.nameCenterX !== undefined        ? Number(body.nameCenterX)  : undefined,
      nameY:        body.nameY !== undefined              ? Number(body.nameY)        : undefined,
      nameMaxWidth: body.nameMaxWidth !== undefined       ? Number(body.nameMaxWidth) : undefined,
      nameFontSize: body.nameFontSize !== undefined       ? Number(body.nameFontSize) : undefined,
      nameFont:     typeof body.nameFont === "string"     ? body.nameFont          : undefined,
      nameColor:    typeof body.nameColor === "string"    ? body.nameColor         : undefined,
      qrX:          body.qrX !== undefined                ? Number(body.qrX)          : undefined,
      qrY:          body.qrY !== undefined                ? Number(body.qrY)          : undefined,
      qrSize:       body.qrSize !== undefined             ? Number(body.qrSize)       : undefined,
      certIdFont:   typeof body.certIdFont === "string"   ? body.certIdFont        : undefined,
      certIdColor:  typeof body.certIdColor === "string"  ? body.certIdColor       : undefined,
      showWatermark: body.showWatermark !== undefined     ? Boolean(body.showWatermark) : undefined,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const result = await resolveOwner(id, session.user.id)
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.template.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
