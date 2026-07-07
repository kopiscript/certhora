import { Zap, Sparkles, Building2, Gift, type LucideIcon } from 'lucide-react'

export interface Tier {
  key: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'
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
    quota: 30,
    icon: Gift,
    color: '#64748B',
    dimColor: 'rgba(100,116,139,0.12)',
    borderColor: 'rgba(100,116,139,0.25)',
    features: [
      '30 certificates / month',
      'Standard certificate template',
      'Publicly verifiable links',
      'QR code on certificate',
      'Email delivery',
    ],
  },
  {
    key: 'STARTER',
    name: 'Starter',
    price: 29.99,
    priceLabel: 'RM 29.99',
    priceSub: '/ month',
    quota: 300,
    icon: Zap,
    color: '#3B82F6',
    dimColor: 'rgba(59,130,246,0.10)',
    borderColor: 'rgba(59,130,246,0.28)',
    badge: 'Most Popular',
    features: [
      '300 certificates / month',
      'Custom certificate background',
      'Bulk / batch generation',
      'Analytics dashboard',
      'Priority email support',
    ],
  },
  {
    key: 'PRO',
    name: 'Pro',
    price: 79.99,
    priceLabel: 'RM 79.99',
    priceSub: '/ month',
    quota: 1000,
    icon: Sparkles,
    color: '#8B5CF6',
    dimColor: 'rgba(139,92,246,0.10)',
    borderColor: 'rgba(139,92,246,0.28)',
    badge: 'Best Value',
    features: [
      '1 000 certificates / month',
      'White-label (remove branding)',
      'Custom domain support',
      'Webhook event notifications',
      '3 team seats',
      'Advanced analytics & exports',
      'Dedicated account manager',
    ],
  },
  {
    key: 'ENTERPRISE',
    name: 'Enterprise',
    price: null,
    priceLabel: 'Custom',
    priceSub: 'contact us',
    quota: Infinity,
    icon: Building2,
    color: '#F59E0B',
    dimColor: 'rgba(245,158,11,0.10)',
    borderColor: 'rgba(245,158,11,0.28)',
    features: [
      'Unlimited certificates',
      'Custom SLA & uptime guarantee',
      'SSO / SAML integration',
      'Custom API access',
      'Unlimited team seats',
      'Dedicated onboarding',
      'Priority 24 / 7 support',
    ],
  },
] as const

export type TierKey = Tier['key']
