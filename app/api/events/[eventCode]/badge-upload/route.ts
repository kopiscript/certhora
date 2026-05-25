import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"])

export async function POST(
  req: Request,
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

  const event = await prisma.event.findUnique({ where: { eventCode } })
  if (!event || event.organizerCd !== organizer.organizerCd) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  let formData: FormData
  try { formData = await req.formData() } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Only PNG, JPEG, or WebP allowed" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be under 5 MB" }, { status: 400 })
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
  const filename = `${eventCode}-${Date.now()}.${ext}`
  const uploadDir = path.join(process.cwd(), "public", "uploads", "badges")

  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()))

  const badgeUrl = `/uploads/badges/${filename}`

  await prisma.event.update({
    where: { eventCode },
    data: { badgeUrl, hasBadge: true },
  })

  return NextResponse.json({ url: badgeUrl }, { status: 201 })
}
