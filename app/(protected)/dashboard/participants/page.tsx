import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ParticipantsClient } from './ParticipantsClient'
import type { CertRow, EventOption } from './ParticipantsClient'

export default async function ParticipantsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
    select: { organizerCd: true },
  })
  if (!organizer) redirect('/login')

  const [events, certs] = await Promise.all([
    prisma.event.findMany({
      where: { organizerCd: organizer.organizerCd },
      select: { eventCode: true, eventName: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.certificate.findMany({
      where: { event: { organizerCd: organizer.organizerCd } },
      orderBy: { createdAt: 'desc' },
      select: {
        certId: true,
        participantName: true,
        participantEmail: true,
        eventCode: true,
        emailStatus: true,
        createdAt: true,
      },
    }),
  ])

  const certRows: CertRow[] = certs.map(c => ({
    certId: c.certId,
    participantName: c.participantName,
    participantEmail: c.participantEmail,
    eventCode: c.eventCode,
    emailStatus: c.emailStatus as CertRow['emailStatus'],
    createdAt: c.createdAt.toISOString(),
  }))

  const eventOptions: EventOption[] = events.map(e => ({
    eventCode: e.eventCode,
    eventName: e.eventName,
  }))

  return <ParticipantsClient events={eventOptions} initialCerts={certRows} />
}
