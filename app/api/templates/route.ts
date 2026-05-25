import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
    select: { organizerCd: true },
  })
  if (!organizer) return NextResponse.json({ error: "Organizer not found" }, { status: 404 })

  const templates = await prisma.template.findMany({
    where: { organizerCd: organizer.organizerCd },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { events: true } } },
  })

  return NextResponse.json(templates)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
    select: { organizerCd: true },
  })
  if (!organizer) return NextResponse.json({ error: "Organizer not found" }, { status: 404 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const {
    name, imageUrl, primaryColor,
    nameCenterX, nameY, nameMaxWidth, nameFontSize, nameFont, nameColor,
    qrX, qrY, qrSize,
    certIdFont, certIdColor, showWatermark,
  } = body as Record<string, unknown>

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Template name is required" }, { status: 400 })
  }

  const template = await prisma.template.create({
    data: {
      organizerCd: organizer.organizerCd,
      name: (name as string).trim(),
      imageUrl: typeof imageUrl === "string" ? imageUrl : null,
      primaryColor: typeof primaryColor === "string" ? primaryColor : "#1D4ED8",
      nameCenterX: Number(nameCenterX) || 600,
      nameY: Number(nameY) || 340,
      nameMaxWidth: Number(nameMaxWidth) || 840,
      nameFontSize: Number(nameFontSize) || 52,
      nameFont: typeof nameFont === "string" ? nameFont : "Arial, Helvetica, sans-serif",
      nameColor: typeof nameColor === "string" ? nameColor : "#1E293B",
      qrX: Number(qrX) || 1010,
      qrY: Number(qrY) || 628,
      qrSize: Number(qrSize) || 140,
      certIdFont: typeof certIdFont === "string" ? certIdFont : "monospace",
      certIdColor: typeof certIdColor === "string" ? certIdColor : "#64748B",
      showWatermark: Boolean(showWatermark),
    },
  })

  return NextResponse.json(template, { status: 201 })
}
