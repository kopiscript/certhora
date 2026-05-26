import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ certId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { certId } = await params

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
    select: { organizerCd: true },
  })
  if (!organizer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Verify this cert belongs to the organizer
  const cert = await prisma.certificate.findFirst({
    where: {
      certId,
      event: { organizerCd: organizer.organizerCd },
    },
    select: { certId: true },
  })
  if (!cert) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const participantName: string | undefined = body.participantName?.trim()
  const participantEmail: string | undefined = body.participantEmail?.trim()

  if (!participantName || !participantEmail) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }
  if (!participantEmail.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const updated = await prisma.certificate.update({
    where: { certId },
    data: { participantName, participantEmail },
    select: { certId: true, participantName: true, participantEmail: true },
  })

  return NextResponse.json(updated)
}
