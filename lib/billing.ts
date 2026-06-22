import "server-only"
import { prisma } from "@/lib/prisma"

export async function applyPendingTierChange(organizerCd: string) {
  const organizer = await prisma.organizer.findUnique({
    where: { organizerCd },
    select: { pendingTier: true, pendingCertQuota: true, pendingEffectiveDate: true },
  })
  if (!organizer?.pendingTier || !organizer.pendingEffectiveDate) return
  if (organizer.pendingEffectiveDate > new Date()) return

  await prisma.organizer.update({
    where: { organizerCd },
    data: {
      tier: organizer.pendingTier,
      certQuota: organizer.pendingCertQuota ?? 0,
      pendingTier: null,
      pendingCertQuota: null,
      pendingEffectiveDate: null,
    },
  })
}
