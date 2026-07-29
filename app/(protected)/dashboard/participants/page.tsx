export const dynamic = "force-dynamic"

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentSession, getCurrentOrganizer } from '@/lib/session'
import { tierCanEmailParticipants } from '@/lib/tiers'
import { buildCertUrl } from '@/lib/certificate-generator'
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

  const urlConfig = { baseUrl: process.env.NEXTAUTH_URL ?? 'http://localhost:3000', viewPageName: 'view' }

  const certRows: CertRow[] = certs.map((c: typeof certs[number]) => ({
    certId: c.certId,
    participantName: c.participantName,
    participantEmail: c.participantEmail,
    eventCode: c.eventCode,
    emailStatus: c.emailStatus as CertRow['emailStatus'],
    createdAt: c.createdAt.toISOString(),
    certUrl: buildCertUrl(urlConfig, c.certId),
  }))

  const eventOptions: EventOption[] = events.map((e: typeof events[number]) => ({
    eventCode: e.eventCode,
    eventName: e.eventName,
  }))

  const canSendEmails = tierCanEmailParticipants(organizer.tier)

  return <ParticipantsClient events={eventOptions} initialCerts={certRows} canSendEmails={canSendEmails} />
}
