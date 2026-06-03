import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { eventCode, npsScore, comment } = body as {
    eventCode?: string
    npsScore?: number
    comment?: string
  }

  if (!eventCode || typeof npsScore !== 'number' || npsScore < 1 || npsScore > 5) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const event = await prisma.event.findUnique({ where: { eventCode }, select: { eventCode: true } })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  await prisma.eventFeedback.create({
    data: {
      eventCode,
      npsScore,
      comment: comment?.trim() || null,
    },
  })

  return NextResponse.json({ ok: true })
}
