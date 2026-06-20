export const dynamic = "force-dynamic"

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentSession, getCurrentOrganizer } from '@/lib/session'
import { SettingsClient } from './SettingsClient'
import type { SettingsData } from './SettingsClient'

export default async function SettingsPage() {
  const session = await getCurrentSession()
  if (!session) redirect('/login')

  const [organizer, user] = await Promise.all([
    getCurrentOrganizer(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    }),
  ])

  if (!organizer || !user) redirect('/login')

  const data: SettingsData = {
    organizerCd: organizer.organizerCd,
    orgName: organizer.orgName,
    socialLink: organizer.socialLink,
    email: user.email ?? '',
  }

  return <SettingsClient initial={data} />
}
