'use client'

import { useState } from 'react'
import {
  CreditCard, Calendar, Zap, ChevronRight, Check,
  X, Download, Receipt, ExternalLink, TrendingUp, Crown,
  Sparkles, Building2, Gift,
} from 'lucide-react'

// ─── Pricing config ───────────────────────────────────────────────────────────
// Adjust these values to update pricing across the entire page.

export const TIERS = [
  {
    key: 'FREE' as const,
    name: 'Free',
    price: null as null | number,
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
    cta: 'Downgrade',
  },
  {
    key: 'STARTER' as const,
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
      'Participant CSV import',
      'Analytics dashboard',
      'Priority email support',
    ],
    cta: 'Upgrade',
  },
  {
    key: 'PRO' as const,
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
    cta: 'Upgrade',
  },
  {
    key: 'ENTERPRISE' as const,
    name: 'Enterprise',
    price: null as null | number,
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
    cta: 'Contact Sales',
  },
] as const

export type TierKey = typeof TIERS[number]['key']

// ─── Payment status config ────────────────────────────────────────────────────

const TXN_STATUS = {
  SUCCESS:  { label: 'Success',  bg: 'rgba(74,222,128,0.10)', color: '#6EE7B7', dot: '#22C55E' },
  PENDING:  { label: 'Pending',  bg: 'rgba(251,191,36,0.10)', color: '#FCD34D', dot: '#F59E0B' },
  FAILED:   { label: 'Failed',   bg: 'rgba(248,113,113,0.10)',color: '#FCA5A5', dot: '#EF4444' },
  REFUNDED: { label: 'Refunded', bg: 'rgba(148,163,184,0.10)',color: '#CBD5E1', dot: '#94A3B8' },
} as const

type TxnStatus = keyof typeof TXN_STATUS

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Transaction {
  id: number
  billcode: string
  amount: string
  tierRequested: TierKey
  status: TxnStatus
  createdAt: string
  refno: string | null
}

export interface OrgInfo {
  tier: TierKey
  certQuota: number
  expiryDate: string | null
  subscribeDate: string | null
  orgName: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ORG: OrgInfo = {
  tier: 'STARTER',
  certQuota: 300,
  expiryDate: '2026-06-26T00:00:00Z',
  subscribeDate: '2025-06-26T00:00:00Z',
  orgName: 'Demo Org',
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 1, billcode: 'BILL-20260526', amount: '29.99', tierRequested: 'STARTER', status: 'SUCCESS',  createdAt: '2026-05-26T10:30:00Z', refno: 'FPX-20260526-001' },
  { id: 2, billcode: 'BILL-20260426', amount: '29.99', tierRequested: 'STARTER', status: 'SUCCESS',  createdAt: '2026-04-26T09:15:00Z', refno: 'FPX-20260426-002' },
  { id: 3, billcode: 'BILL-20260326', amount: '29.99', tierRequested: 'STARTER', status: 'SUCCESS',  createdAt: '2026-03-26T11:00:00Z', refno: 'FPX-20260326-003' },
  { id: 4, billcode: 'BILL-20260226', amount: '29.99', tierRequested: 'STARTER', status: 'SUCCESS',  createdAt: '2026-02-26T08:45:00Z', refno: 'FPX-20260226-004' },
  { id: 5, billcode: 'BILL-20260126', amount: '79.99', tierRequested: 'PRO',     status: 'FAILED',   createdAt: '2026-01-26T14:20:00Z', refno: null },
  { id: 6, billcode: 'BILL-20251226', amount: '29.99', tierRequested: 'STARTER', status: 'SUCCESS',  createdAt: '2025-12-26T10:00:00Z', refno: 'FPX-20251226-006' },
  { id: 7, billcode: 'BILL-20251126', amount: '29.99', tierRequested: 'STARTER', status: 'REFUNDED', createdAt: '2025-11-26T13:30:00Z', refno: 'FPX-20251126-007' },
  { id: 8, billcode: 'BILL-20251026', amount: '0.00',  tierRequested: 'FREE',    status: 'SUCCESS',  createdAt: '2025-10-26T09:00:00Z', refno: 'FREE-TIER' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('en-MY', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso))
}

function downloadReceipt(txn: Transaction) {
  const lines = [
    '─────────────────────────────────',
    '          CERTHORA RECEIPT        ',
    '─────────────────────────────────',
    `Transaction ID : ${txn.billcode}`,
    `Reference No   : ${txn.refno ?? '—'}`,
    `Date           : ${fmtDate(txn.createdAt)}`,
    `Plan           : ${txn.tierRequested}`,
    `Amount         : RM ${Number(txn.amount).toFixed(2)}`,
    `Status         : ${TXN_STATUS[txn.status].label}`,
    '─────────────────────────────────',
    'Thank you for using Certhora.',
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `receipt-${txn.billcode}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TxnStatus }) {
  const cfg = TXN_STATUS[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 6,
      background: cfg.bg, fontSize: 11, fontWeight: 600,
      letterSpacing: '0.03em', color: cfg.color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

// ─── Tier Badge ───────────────────────────────────────────────────────────────

function TierBadge({ tierKey }: { tierKey: TierKey }) {
  const tier = TIERS.find(t => t.key === tierKey)!
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 6,
      background: tier.dimColor, border: `1px solid ${tier.borderColor}`,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
      textTransform: 'uppercase', color: tier.color,
    }}>
      <tier.icon size={10} strokeWidth={2.5} />
      {tier.name}
    </span>
  )
}

// ─── Plans Modal ──────────────────────────────────────────────────────────────

function PlansModal({ currentTier, onClose }: { currentTier: TierKey; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', overflowY: 'auto',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '100%', maxWidth: 900,
        background: 'var(--card)', border: '1px solid var(--ct-border-md)',
        borderRadius: 16, boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
        overflow: 'hidden',
      }}>
        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--ct-border)',
        }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ct-text)' }}>Choose a Plan</p>
            <p style={{ fontSize: 12, color: 'var(--ct-text-3)', marginTop: 2 }}>
              Upgrade or downgrade anytime. Changes take effect immediately.
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8, border: '1px solid var(--ct-border)',
            background: 'transparent', color: 'var(--ct-text-3)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Tier grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 1, background: 'var(--ct-border)',
        }}>
          {TIERS.map(tier => {
            const isCurrent = tier.key === currentTier
            const Icon = tier.icon
            return (
              <div key={tier.key} style={{
                padding: '24px 20px',
                background: isCurrent ? `${tier.dimColor}` : 'var(--card)',
                position: 'relative',
                display: 'flex', flexDirection: 'column', gap: 16,
              }}>
                {/* Popular badge */}
                {'badge' in tier && (
                  <div style={{
                    position: 'absolute', top: 14, right: 14,
                    padding: '2px 8px', borderRadius: 5,
                    background: `${tier.borderColor}`, border: `1px solid ${tier.borderColor}`,
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: tier.color,
                  }}>
                    {tier.badge}
                  </div>
                )}

                {/* Icon + name */}
                <div>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, marginBottom: 10,
                    background: tier.dimColor, border: `1px solid ${tier.borderColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} style={{ color: tier.color }} />
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ct-text)' }}>{tier.name}</p>
                  <div style={{ marginTop: 4 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--ct-text)', letterSpacing: '-0.02em' }}>
                      {tier.priceLabel}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--ct-text-3)', marginLeft: 4 }}>{tier.priceSub}</span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--ct-text-3)', marginTop: 3 }}>
                    {tier.quota === Infinity ? 'Unlimited certs' : `${tier.quota.toLocaleString()} certs / month`}
                  </p>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--ct-border)' }} />

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                  {tier.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: 'var(--ct-text-2)' }}>
                      <Check size={12} style={{ color: tier.color, marginTop: 1, flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button style={{
                  width: '100%', height: 34, borderRadius: 8,
                  border: isCurrent ? `1px solid ${tier.borderColor}` : 'none',
                  background: isCurrent ? 'transparent' : tier.color,
                  color: isCurrent ? tier.color : '#fff',
                  fontSize: 12, fontWeight: 600, cursor: isCurrent ? 'default' : 'pointer',
                  opacity: isCurrent ? 0.8 : 1,
                }}>
                  {isCurrent ? '✓ Current Plan' : tier.cta}
                </button>
              </div>
            )
          })}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--ct-border)' }}>
          <p style={{ fontSize: 11, color: 'var(--ct-text-3)', textAlign: 'center' }}>
            All plans include SSL encryption, 99.9% uptime SLA, and standard support.
            Payments processed securely via FPX / card.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  org: OrgInfo
  transactions: Transaction[]
  monthlyUsed: number
}

export function BillingClient({ org: propOrg, transactions: propTxns, monthlyUsed }: Props) {
  const org = propOrg ?? MOCK_ORG
  const transactions = propTxns.length > 0 ? propTxns : MOCK_TRANSACTIONS

  const [showPlans, setShowPlans] = useState(false)

  const activeTier = TIERS.find(t => t.key === org.tier) ?? TIERS[1]
  const usedPct = org.certQuota > 0
    ? Math.min(100, Math.round((monthlyUsed / org.certQuota) * 100))
    : 0
  const barColor = usedPct >= 90 ? '#EF4444' : usedPct >= 70 ? '#F59E0B' : activeTier.color

  const TierIcon = activeTier.icon

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <header style={{
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', borderBottom: '1px solid var(--ct-border)', flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ct-text)' }}>Billing &amp; Subscription</h1>
          <p style={{ fontSize: 12, color: 'var(--ct-text-3)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
            <CreditCard size={11} />
            {transactions.length} invoice record{transactions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto' }}>

        {/* ── Current Plan Card ──────────────────────────────────────────────── */}
        <div style={{
          borderRadius: 14,
          border: `1px solid ${activeTier.borderColor}`,
          background: 'var(--card)',
          overflow: 'hidden',
          boxShadow: `0 0 0 1px ${activeTier.dimColor}, inset 0 0 60px ${activeTier.dimColor}`,
        }}>
          {/* Top accent bar */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${activeTier.color}, ${activeTier.color}88)` }} />

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 24, padding: '24px 28px',
            alignItems: 'center',
          }}>
            {/* Left: plan info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
              {/* Tier badge + name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <TierBadge tierKey={org.tier} />
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--ct-text)', letterSpacing: '-0.02em' }}>
                    {activeTier.name} Plan
                  </span>
                  <span style={{ fontSize: 14, color: activeTier.color, fontWeight: 600 }}>
                    {activeTier.priceLabel}
                    {activeTier.price !== null && <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--ct-text-3)' }}>/month</span>}
                  </span>
                </div>
              </div>

              {/* Meta row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {org.expiryDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ct-text-3)' }}>
                    <Calendar size={13} style={{ color: activeTier.color, opacity: 0.8 }} />
                    Renews on <span style={{ color: 'var(--ct-text-2)', fontWeight: 500, marginLeft: 3 }}>{fmtDate(org.expiryDate)}</span>
                  </div>
                )}
                {org.subscribeDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ct-text-3)' }}>
                    <TrendingUp size={13} style={{ color: activeTier.color, opacity: 0.8 }} />
                    Active since <span style={{ color: 'var(--ct-text-2)', fontWeight: 500, marginLeft: 3 }}>{fmtDate(org.subscribeDate)}</span>
                  </div>
                )}
              </div>

              {/* Usage bar */}
              <div style={{ maxWidth: 420 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--ct-text-2)', fontWeight: 500 }}>
                    Monthly certificate usage
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: usedPct >= 90 ? '#EF4444' : 'var(--ct-text-2)', fontVariantNumeric: 'tabular-nums' }}>
                    {monthlyUsed.toLocaleString()} / {org.certQuota === 0 ? '∞' : org.certQuota.toLocaleString()}
                  </span>
                </div>
                <div style={{
                  height: 6, borderRadius: 999, background: 'var(--ct-surface-2)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 999,
                    width: `${usedPct}%`, background: barColor,
                    transition: 'width 600ms cubic-bezier(0.22, 1, 0.36, 1)',
                    boxShadow: `0 0 8px ${barColor}88`,
                  }} />
                </div>
                {usedPct >= 80 && (
                  <p style={{ marginTop: 5, fontSize: 11, color: usedPct >= 90 ? '#EF4444' : '#F59E0B' }}>
                    {usedPct >= 90 ? '⚠ Approaching quota limit. Upgrade to avoid disruptions.' : 'You have used most of your quota this month.'}
                  </p>
                )}
              </div>
            </div>

            {/* Right: CTA */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 10,
              alignItems: 'flex-end', flexShrink: 0,
            }}>
              <button
                onClick={() => setShowPlans(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  height: 40, padding: '0 18px', borderRadius: 10,
                  background: activeTier.color, border: 'none',
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  boxShadow: `0 4px 14px ${activeTier.color}55`,
                  transition: 'opacity 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <Crown size={14} />
                View All Plans
                <ChevronRight size={13} />
              </button>
              <p style={{ fontSize: 11, color: 'var(--ct-text-3)', textAlign: 'right', maxWidth: 160 }}>
                Compare all tiers and upgrade or downgrade anytime.
              </p>
            </div>
          </div>
        </div>

        {/* ── Payment History ────────────────────────────────────────────────── */}
        <div style={{
          borderRadius: 14, border: '1px solid var(--ct-border)',
          background: 'var(--card)', overflow: 'hidden',
        }}>
          {/* Section header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 24px', borderBottom: '1px solid var(--ct-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--ct-blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Receipt size={13} style={{ color: '#60A5FA' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ct-text)' }}>Payment History</p>
                <p style={{ fontSize: 11, color: 'var(--ct-text-3)', marginTop: 1 }}>{transactions.length} transactions</p>
              </div>
            </div>
          </div>

          {/* Table */}
          {transactions.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '48px 24px' }}>
              <Receipt size={28} style={{ color: 'var(--ct-text-3)' }} />
              <p style={{ fontSize: 14, color: 'var(--ct-text-2)' }}>No transactions yet</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--ct-border)' }}>
                    {['Transaction ID', 'Date', 'Plan', 'Amount', 'Status', ''].map((col, i) => (
                      <th key={i} style={{
                        padding: '10px 20px', textAlign: 'left',
                        fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: 'var(--ct-text-3)',
                        whiteSpace: 'nowrap', background: 'var(--card)',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn, idx) => {
                    const tierCfg = TIERS.find(t => t.key === txn.tierRequested)
                    return (
                      <tr
                        key={txn.id}
                        style={{
                          borderBottom: idx < transactions.length - 1 ? '1px solid var(--ct-border)' : 'none',
                          transition: 'background 120ms',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--ct-blue-dim)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Transaction ID */}
                        <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{
                              fontFamily: 'monospace', fontSize: 12,
                              color: 'var(--ct-text-2)', letterSpacing: '0.03em',
                              background: 'var(--ct-surface-2)', padding: '3px 8px',
                              borderRadius: 5, border: '1px solid var(--ct-border)',
                              display: 'inline-block',
                            }}>
                              {txn.billcode}
                            </span>
                            {txn.refno && (
                              <span style={{ fontSize: 10, color: 'var(--ct-text-3)', fontFamily: 'monospace', paddingLeft: 8 }}>
                                {txn.refno}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Date */}
                        <td style={{ padding: '14px 20px', whiteSpace: 'nowrap', color: 'var(--ct-text-2)', fontSize: 13 }}>
                          {fmtDate(txn.createdAt)}
                        </td>

                        {/* Plan */}
                        <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                          {tierCfg ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '3px 9px', borderRadius: 6,
                              background: tierCfg.dimColor, border: `1px solid ${tierCfg.borderColor}`,
                              fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
                              textTransform: 'uppercase', color: tierCfg.color,
                            }}>
                              <tierCfg.icon size={10} />
                              {tierCfg.name}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--ct-text-3)', fontSize: 12 }}>{txn.tierRequested}</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ct-text)', fontVariantNumeric: 'tabular-nums' }}>
                            RM {Number(txn.amount).toFixed(2)}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                          <StatusBadge status={txn.status} />
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 20px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                          <button
                            onClick={() => downloadReceipt(txn)}
                            title="Download receipt"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              height: 28, padding: '0 10px', borderRadius: 7,
                              border: '1px solid var(--ct-border)', background: 'transparent',
                              color: 'var(--ct-text-3)', fontSize: 11, cursor: 'pointer',
                              transition: 'border-color 150ms, color 150ms',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ct-blue)'; e.currentTarget.style.color = '#93C5FD' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--ct-border)'; e.currentTarget.style.color = 'var(--ct-text-3)' }}
                          >
                            <Download size={11} />
                            Receipt
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Support note */}
        <p style={{ fontSize: 11, color: 'var(--ct-text-3)', textAlign: 'center', paddingBottom: 8 }}>
          Questions about your billing?{' '}
          <a href="mailto:support@certhora.com" style={{ color: 'var(--ct-blue)', textDecoration: 'none' }}>
            Contact support
          </a>
        </p>

      </div>

      {/* ── Plans Modal ─────────────────────────────────────────────────────── */}
      {showPlans && (
        <PlansModal currentTier={org.tier} onClose={() => setShowPlans(false)} />
      )}
    </div>
  )
}
