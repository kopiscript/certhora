export const dynamic = "force-dynamic"

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentSession, getCurrentOrganizer } from '@/lib/session'
import { BillingClient } from './BillingClient'
import type { OrgInfo, Transaction } from './BillingClient'
import { normalizeTierKey } from '@/lib/tiers'

export default async function BillingPage() {
  const session = await getCurrentSession()
  if (!session) redirect('/login')

  const organizer = await getCurrentOrganizer(session.user.id)
  if (!organizer) redirect('/login')

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [transactions, monthlyUsed] = await Promise.all([
    prisma.paymentTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        billcode: true,
        amount: true,
        tierRequested: true,
        status: true,
        createdAt: true,
        refno: true,
      },
    }),
    prisma.certificate.count({
      where: {
        event: { organizerCd: organizer.organizerCd },
        createdAt: { gte: monthStart },
      },
    }),
  ])

  const org: OrgInfo = {
    tier: normalizeTierKey(organizer.tier),
    certQuota: organizer.certQuota,
    expiryDate: organizer.expiryDate?.toISOString() ?? null,
    subscribeDate: organizer.subscribeDate?.toISOString() ?? null,
    orgName: organizer.orgName,
    pendingTier: organizer.pendingTier ? normalizeTierKey(organizer.pendingTier) : null,
    pendingEffectiveDate: organizer.pendingEffectiveDate?.toISOString() ?? null,
  }

  const txns: Transaction[] = transactions.map((t: typeof transactions[number]) => ({
    id: t.id,
    billcode: t.billcode,
    amount: t.amount.toString(),
    tierRequested: normalizeTierKey(t.tierRequested),
    status: t.status as Transaction['status'],
    createdAt: t.createdAt.toISOString(),
    refno: t.refno ?? null,
  }))

  const fullName = session.user.name ?? ''
  const [firstName, ...rest] = fullName.split(' ').filter(Boolean)

  const checkoutDefaults = {
    firstName: firstName ?? '',
    lastName: rest.join(' '),
    email: session.user.email ?? '',
    orgName: organizer.orgName,
  }

  return <BillingClient org={org} transactions={txns} monthlyUsed={monthlyUsed} checkoutDefaults={checkoutDefaults} />
}
