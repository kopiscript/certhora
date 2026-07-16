import "server-only"
import { prisma } from "@/lib/prisma"
import { TIERS } from "@/lib/tiers"

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

// There's no recurring/auto-charge billing — a paid tier is really a
// "credit pack" that lasts until `expiryDate`. Renewal always requires
// paying again first (POST /api/billing/checkout), so once expiryDate
// passes with no explicit pending downgrade already queued, drop the
// organizer straight to Free rather than silently letting them keep a
// paid quota forever.
export async function applyExpiredSubscription(organizerCd: string) {
  const organizer = await prisma.organizer.findUnique({
    where: { organizerCd },
    select: { tier: true, expiryDate: true, pendingTier: true },
  })
  if (!organizer) return
  if (organizer.tier === "FREE") return
  if (organizer.pendingTier) return // an explicit downgrade is already scheduled — let that run instead
  if (!organizer.expiryDate || organizer.expiryDate > new Date()) return

  const freeTier = TIERS.find(t => t.key === "FREE")

  await prisma.organizer.update({
    where: { organizerCd },
    data: {
      tier: "FREE",
      certQuota: freeTier?.quota ?? 0,
      expiryDate: null,
    },
  })

  await prisma.subscription.update({
    where: { organizerCd },
    data: { suspendDate: new Date() },
  }).catch(() => {})
}
