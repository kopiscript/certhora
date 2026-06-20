export const dynamic = "force-dynamic"

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentSession, getCurrentOrganizer } from '@/lib/session'
import { ParticipantsClient } from './ParticipantsClient'
import type { CertRow, EventOption } from './ParticipantsClient'

export default async function ParticipantsPage() {
  const session = await getCurrentSession()
  if (!session) redirect('/login')

  const organizer = await getCurrentOrganizer(session.user.id)
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

  const certRows: CertRow[] = certs.map((c: typeof certs[number]) => ({
    certId: c.certId,
    participantName: c.participantName,
    participantEmail: c.participantEmail,
    eventCode: c.eventCode,
    emailStatus: c.emailStatus as CertRow['emailStatus'],
    createdAt: c.createdAt.toISOString(),
  }))

  const eventOptions: EventOption[] = events.map((e: typeof events[number]) => ({
    eventCode: e.eventCode,
    eventName: e.eventName,
  }))

  return <ParticipantsClient events={eventOptions} initialCerts={certRows} />
}
