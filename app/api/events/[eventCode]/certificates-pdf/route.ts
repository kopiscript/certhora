import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { PDFDocument } from "pdf-lib"
import sharp from "sharp"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const maxDuration = 60

const BATCH = 50
const CONCURRENCY = 8
const A4_LANDSCAPE = { width: 841.89, height: 595.28 }

async function loadImage(src: string): Promise<{ bytes: Uint8Array; kind: "png" | "jpg" }> {
  const res = await fetch(src)
  if (!res.ok) throw new Error(`Image request failed (${res.status})`)
  const buf = Buffer.from(await res.arrayBuffer())
  const isPng = buf[0] === 0x89 && buf[1] === 0x50
  const isJpg = buf[0] === 0xff && buf[1] === 0xd8
  if (isPng) return { bytes: buf, kind: "png" }
  if (isJpg) return { bytes: buf, kind: "jpg" }
  return { bytes: await sharp(buf).png().toBuffer(), kind: "png" }
}

export async function GET(
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

  const event = await prisma.event.findUnique({
    where: { eventCode },
    select: { organizerCd: true, eventName: true },
  })
  if (!event || event.organizerCd !== organizer.organizerCd) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  const url = new URL(req.url)
  const idsParam = url.searchParams.get("ids")
  const requestedIds = idsParam ? Array.from(new Set(idsParam.split(",").filter(Boolean))) : null
  const parsedFrom = Number.parseInt(url.searchParams.get("from") ?? "0", 10)
  const start = Number.isFinite(parsedFrom) && parsedFrom > 0 ? parsedFrom : 0

  const certs = await prisma.certificate.findMany({
    where: {
      eventCode,
      emailStatus: { not: "PENDING" },
      ...(requestedIds ? { certId: { in: requestedIds } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: { certId: true, imageUrl: true },
  })

  const batch = certs.slice(start, start + BATCH)
  if (batch.length === 0) {
    return NextResponse.json({ error: "No generated certificates to export" }, { status: 404 })
  }

  const images: ({ bytes: Uint8Array; kind: "png" | "jpg" } | null)[] = new Array(batch.length).fill(null)
  let cursor = 0
  const worker = async () => {
    while (cursor < batch.length) {
      const i = cursor++
      const c = batch[i]
      const src = c.imageUrl ?? `${url.origin}/api/certs/${c.certId}/preview`
      try {
        images[i] = await loadImage(src)
      } catch {
        images[i] = null
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batch.length) }, worker))

  const pdf = await PDFDocument.create()
  for (const img of images) {
    if (!img) continue
    const embedded = img.kind === "png" ? await pdf.embedPng(img.bytes) : await pdf.embedJpg(img.bytes)
    const page = pdf.addPage([A4_LANDSCAPE.width, A4_LANDSCAPE.height])
    const scale = Math.min(A4_LANDSCAPE.width / embedded.width, A4_LANDSCAPE.height / embedded.height)
    const w = embedded.width * scale
    const h = embedded.height * scale
    page.drawImage(embedded, {
      x: (A4_LANDSCAPE.width - w) / 2,
      y: (A4_LANDSCAPE.height - h) / 2,
      width: w,
      height: h,
    })
  }

  if (pdf.getPageCount() === 0) {
    return NextResponse.json({ error: "Could not load any certificate images" }, { status: 502 })
  }

  const bytes = await pdf.save()
  const safeName = (event.eventName || eventCode).replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || eventCode
  const part = certs.length > BATCH ? `-${start + 1}-${start + batch.length}` : ""

  return new Response(bytes.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}-certificates${part}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  })
}
