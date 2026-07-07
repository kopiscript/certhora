import { Zap, Sparkles, Gift, type LucideIcon } from 'lucide-react'

export interface Tier {
  key: 'FREE' | 'STARTER' | 'PRO'
  name: string
  price: number | null
  priceLabel: string
  priceSub: string
  quota: number
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
    quota: 40,
    icon: Gift,
    color: '#64748B',
    dimColor: 'rgba(100,116,139,0.12)',
    borderColor: 'rgba(100,116,139,0.25)',
    features: [
      '40 certificates / month',
      'Standard certificate template',
      'Publicly verifiable links',
      'QR code on certificate',
      'Email delivery',
      'Bulk CSV import',
    ],
  },
  {
    key: 'STARTER',
    name: 'Starter',
    price: 11.99,
    priceLabel: 'RM 11.99',
    priceSub: '/ month',
    quota: 100,
    icon: Zap,
    color: '#3B82F6',
    dimColor: 'rgba(59,130,246,0.10)',
    borderColor: 'rgba(59,130,246,0.28)',
    badge: 'Most Popular',
    features: [
      '100 certificates / month',
      'Custom certificate background',
      'Bulk / batch generation',
      'Bulk CSV import',
      'Analytics dashboard',
      'Priority email support',
    ],
  },
  {
    key: 'PRO',
    name: 'Pro',
    price: 39.99,
    priceLabel: 'RM 39.99',
    priceSub: '/ month',
    quota: 500,
    icon: Sparkles,
    color: '#8B5CF6',
    dimColor: 'rgba(139,92,246,0.10)',
    borderColor: 'rgba(139,92,246,0.28)',
    badge: 'Best Value',
    features: [
      '500 certificates / month',
      'Custom certificate background',
      'Bulk / batch generation',
      'Bulk CSV import',
      'Analytics dashboard',
      'Priority email support',
    ],
  },
] as const

export type TierKey = Tier['key']
