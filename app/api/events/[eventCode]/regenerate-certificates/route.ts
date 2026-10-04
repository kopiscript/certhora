import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadToR2 } from "@/lib/r2"
import { loadRenderContext, renderCertificateImage } from "@/lib/render-certificate"

export const maxDuration = 60

const BATCH = 25
const CONCURRENCY = 5

// Redraws certificates that were already generated, using the event's current
// design. Only imageUrl changes: email status, send history and the monthly
// quota are untouched, and every certificate keeps its link. The client calls
// this repeatedly, advancing `from` by the returned `next`, so large events
// stay within the function time limit.
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

  const event = await prisma.event.findUnique({
    where: { eventCode },
    include: {
      organizer: { select: { orgName: true } },
      template: true,
    },
  })
  if (!event || event.organizerCd !== organizer.organizerCd) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  let body: { ids?: unknown; from?: unknown } = {}
  try { body = await req.json() } catch {}

  const ids = Array.isArray(body.ids)
    ? Array.from(new Set(body.ids.filter((v): v is string => typeof v === "string")))
    : null
  const from = typeof body.from === "number" && Number.isFinite(body.from) && body.from > 0 ? Math.floor(body.from) : 0

  const targets = await prisma.certificate.findMany({
    where: {
      eventCode,
      emailStatus: { not: "PENDING" },
      ...(ids ? { certId: { in: ids } } : {}),
    },
    orderBy: [{ createdAt: "asc" }, { certId: "asc" }],
    select: { certId: true, participantName: true, metadata: true },
  })

  if (targets.length === 0) {
    return NextResponse.json({ error: "No generated certificates to regenerate" }, { status: 404 })
  }

  const batch = targets.slice(from, from + BATCH)

  let ctx
  try {
    ctx = await loadRenderContext(event)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 })
  }

  const stamp = Date.now()
  let processed = 0
  let failed = 0
  for (let i = 0; i < batch.length; i += CONCURRENCY) {
    const chunk = batch.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(
      chunk.map(async (c) => {
        const png = await renderCertificateImage(ctx, c)
        const url = await uploadToR2(`certificates/${c.certId}.png`, png, "image/png")
        await prisma.certificate.update({
          where: { certId: c.certId },
          data: { imageUrl: `${url}?v=${stamp}` },
        })
      })
    )
    for (const r of results) {
      if (r.status === "fulfilled") processed++
      else failed++
    }
  }

  const nextFrom = from + BATCH
  return NextResponse.json({
    processed,
    failed,
    total: targets.length,
    next: nextFrom < targets.length ? nextFrom : null,
  })
}
