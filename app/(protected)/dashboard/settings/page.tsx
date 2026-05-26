import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SettingsClient } from './SettingsClient'
import type { SettingsData } from './SettingsClient'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const [organizer, user] = await Promise.all([
    prisma.organizer.findUnique({
      where: { userId: session.user.id },
      select: { organizerCd: true, orgName: true, socialLink: true },
    }),
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
