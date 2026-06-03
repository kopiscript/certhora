export const dynamic = "force-dynamic"

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BillingClient } from './BillingClient'
import type { OrgInfo, Transaction, TierKey } from './BillingClient'

export default async function BillingPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
    select: {
      organizerCd: true,
      orgName: true,
      tier: true,
      certQuota: true,
      expiryDate: true,
      subscribeDate: true,
    },
  })
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
    tier: organizer.tier as TierKey,
    certQuota: organizer.certQuota,
    expiryDate: organizer.expiryDate?.toISOString() ?? null,
    subscribeDate: organizer.subscribeDate?.toISOString() ?? null,
    orgName: organizer.orgName,
  }

  const txns: Transaction[] = transactions.map((t: typeof transactions[number]) => ({
    id: t.id,
    billcode: t.billcode,
    amount: t.amount.toString(),
    tierRequested: t.tierRequested as TierKey,
    status: t.status as Transaction['status'],
    createdAt: t.createdAt.toISOString(),
    refno: t.refno ?? null,
  }))

  return <BillingClient org={org} transactions={txns} monthlyUsed={monthlyUsed} />
}
