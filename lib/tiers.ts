import { Sparkles, Gift, type LucideIcon } from 'lucide-react'

export interface Tier {
  key: 'FREE' | 'PRO'
  name: string
  price: number | null
  priceLabel: string
  priceSub: string
  quota: number
  canEmailParticipants: boolean
  icon: LucideIcon
  color: string
  dimColor: string
  borderColor: string
  badge?: string
  features: string[]
}

export const TIERS: readonly Tier[] = [
  {
    key: 'FREE',
    name: 'Free',
    price: null,
    priceLabel: 'RM 0',
    priceSub: 'forever',
    quota: 100,
    canEmailParticipants: false,
    icon: Gift,
    color: '#64748B',
    dimColor: 'rgba(100,116,139,0.12)',
    borderColor: 'rgba(100,116,139,0.25)',
    features: [
      '100 certificates / month',
      'Standard certificate template',
      'Publicly verifiable links',
      'QR code on certificate',
      'Bulk CSV import',
      'Download and share certificates manually',
    ],
  },
  {
    key: 'PRO',
    name: 'Pro',
    price: 10,
    priceLabel: 'RM 10',
    priceSub: '/ month',
    quota: 500,
    canEmailParticipants: true,
    icon: Sparkles,
    color: '#8B5CF6',
    dimColor: 'rgba(139,92,246,0.10)',
    borderColor: 'rgba(139,92,246,0.28)',
    badge: 'Most Popular',
    features: [
      '500 certificates / month',
      'Custom certificate background',
      'Bulk / batch generation',
      'Bulk CSV import',
      'Analytics dashboard',
      'Email delivery to participants',
    ],
  },
] as const

export type TierKey = Tier['key']

export function normalizeTierKey(tier: string | null | undefined): TierKey {
  return tier === 'FREE' ? 'FREE' : 'PRO'
}

export function getTier(tier: string | null | undefined): Tier {
  const normalized = normalizeTierKey(tier)
  return TIERS.find(t => t.key === normalized) ?? TIERS[0]
}

export function tierCanEmailParticipants(tier: string | null | undefined): boolean {
  return getTier(tier).canEmailParticipants
}
