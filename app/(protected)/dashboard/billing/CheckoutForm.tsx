'use client'

import { useState } from 'react'
import { X, CreditCard, Landmark } from 'lucide-react'
import type { Tier } from '@/lib/tiers'

const COUNTRIES = [
  'Malaysia', 'Singapore', 'Indonesia', 'Thailand', 'Brunei', 'Philippines',
  'Vietnam', 'Australia', 'United Kingdom', 'United States', 'India', 'China',
  'Japan', 'South Korea', 'Other',
]

export interface CheckoutDefaults {
  firstName: string
  lastName: string
  email: string
  orgName: string
}

interface Props {
  tier: Tier
  defaults: CheckoutDefaults
  onClose: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 38, borderRadius: 8, padding: '0 12px',
  border: '1px solid var(--ct-border)', background: 'var(--ct-surface-2)',
  color: 'var(--ct-text)', fontSize: 13, outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--ct-text-3)',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block',
}

export default function CheckoutForm({ tier, defaults, onClose }: Props) {
  const [firstName, setFirstName] = useState(defaults.firstName)
  const [lastName, setLastName] = useState(defaults.lastName)
  const [email, setEmail] = useState(defaults.email)
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('Malaysia')
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'FPX'>('FPX')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = firstName.trim() && lastName.trim() && email.trim() && phone.trim() && country && agreeTerms && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: tier.key,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          country,
          paymentMethod,
          agreeTerms,
        }),
      })
      const data = await res.json()
      if (res.ok && data.paymentUrl) {
        window.location.href = data.paymentUrl
        return
      }
      setError(data.error ?? 'Failed to start checkout')
    } catch {
      setError('Failed to start checkout')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 110,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', overflowY: 'auto',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--card)', border: '1px solid var(--ct-border-md)',
          borderRadius: 16, boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid var(--ct-border)',
        }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ct-text)' }}>Checkout</p>
            <p style={{ fontSize: 12, color: 'var(--ct-text-3)', marginTop: 2 }}>
              {tier.name} Plan — {tier.priceLabel}{tier.priceSub ? `/${tier.priceSub}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8, border: '1px solid var(--ct-border)',
            background: 'transparent', color: 'var(--ct-text-3)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>First Name</label>
              <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} required />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email Address</label>
            <input type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div>
            <label style={labelStyle}>Organization</label>
            <input style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} value={defaults.orgName} disabled />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input
                type="tel" style={inputStyle} value={phone}
                onChange={e => setPhone(e.target.value)} placeholder="+60 12-345 6789" required
              />
            </div>
            <div>
              <label style={labelStyle}>Country</label>
              <select style={inputStyle} value={country} onChange={e => setCountry(e.target.value)} required>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Payment Method</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {([
                { key: 'FPX' as const, label: 'Online Banking (FPX)', icon: Landmark },
                { key: 'CARD' as const, label: 'Credit / Debit Card', icon: CreditCard },
              ]).map(opt => {
                const Icon = opt.icon
                const active = paymentMethod === opt.key
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setPaymentMethod(opt.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      height: 44, borderRadius: 9, padding: '0 12px',
                      border: active ? '1px solid var(--ct-blue)' : '1px solid var(--ct-border)',
                      background: active ? 'var(--ct-blue-dim)' : 'var(--ct-surface-2)',
                      color: active ? '#93C5FD' : 'var(--ct-text-2)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <Icon size={14} />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--ct-text-2)', cursor: 'pointer', marginTop: 4 }}>
            <input
              type="checkbox" checked={agreeTerms}
              onChange={e => setAgreeTerms(e.target.checked)}
              style={{ marginTop: 2, width: 14, height: 14, accentColor: 'var(--ct-blue)' }}
              required
            />
            <span>
              I agree to the{' '}
              <a href="/terms" target="_blank" style={{ color: 'var(--ct-blue)', textDecoration: 'none' }}>Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" target="_blank" style={{ color: 'var(--ct-blue)', textDecoration: 'none' }}>Privacy Policy</a>.
            </span>
          </label>

          {error && (
            <p style={{ fontSize: 12, color: '#FCA5A5', background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, padding: '8px 10px' }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 22px', borderTop: '1px solid var(--ct-border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button" onClick={onClose}
            style={{
              height: 38, padding: '0 16px', borderRadius: 8,
              border: '1px solid var(--ct-border)', background: 'transparent',
              color: 'var(--ct-text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit" disabled={!canSubmit}
            style={{
              height: 38, padding: '0 18px', borderRadius: 8, border: 'none',
              background: tier.color, color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: canSubmit ? 'pointer' : 'default', opacity: canSubmit ? 1 : 0.5,
            }}
          >
            {submitting ? 'Redirecting…' : `Pay ${tier.priceLabel}`}
          </button>
        </div>
      </form>
    </div>
  )
}
