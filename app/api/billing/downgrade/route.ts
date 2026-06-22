import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TIERS, type TierKey } from "@/lib/tiers"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { tier } = (await req.json()) as { tier?: TierKey }
  const targetTier = TIERS.find(t => t.key === tier)
  if (!targetTier) return NextResponse.json({ error: "Invalid tier" }, { status: 400 })

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
    select: { organizerCd: true, tier: true, expiryDate: true },
  })
  if (!organizer) return NextResponse.json({ error: "Organizer not found" }, { status: 404 })

  const currentIndex = TIERS.findIndex(t => t.key === organizer.tier)
  const targetIndex = TIERS.findIndex(t => t.key === targetTier.key)
  if (targetIndex >= currentIndex) {
    return NextResponse.json({ error: "Use the checkout endpoint for this tier change" }, { status: 400 })
  }

  const certQuota = targetTier.quota === Infinity ? 0 : targetTier.quota

  // No paid-through period to wait out (e.g. already on FREE with no expiry) — apply now.
  if (!organizer.expiryDate) {
    const updated = await prisma.organizer.update({
      where: { organizerCd: organizer.organizerCd },
      data: { tier: targetTier.key, certQuota, pendingTier: null, pendingCertQuota: null, pendingEffectiveDate: null },
      select: { tier: true, certQuota: true, expiryDate: true, pendingTier: true, pendingEffectiveDate: true },
    })
    return NextResponse.json({ organizer: updated })
  }

  const updated = await prisma.organizer.update({
    where: { organizerCd: organizer.organizerCd },
    data: {
      pendingTier: targetTier.key,
      pendingCertQuota: certQuota,
      pendingEffectiveDate: organizer.expiryDate,
    },
    select: { tier: true, certQuota: true, expiryDate: true, pendingTier: true, pendingEffectiveDate: true },
  })
  return NextResponse.json({ organizer: updated })
}
