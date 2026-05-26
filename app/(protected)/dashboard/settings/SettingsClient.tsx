'use client'

import { useState, useRef } from 'react'
import {
  Building2, Link2, Hash, Mail, Lock, ShieldCheck,
  Loader2, Check, Save, KeyRound, ChevronRight, Eye, EyeOff,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SettingsData {
  organizerCd: string
  orgName: string
  socialLink: string | null
  email: string
}

// ─── Shared input wrapper ─────────────────────────────────────────────────────

function Field({
  label,
  caption,
  children,
}: {
  label: string
  caption?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label className="ct-label" style={{ marginBottom: 0 }}>{label}</label>
      {children}
      {caption && (
        <p style={{ fontSize: 11, color: 'var(--ct-text-3)', lineHeight: 1.4 }}>{caption}</p>
      )}
    </div>
  )
}

// ─── Prefixed input ───────────────────────────────────────────────────────────

function PrefixedInput({
  prefix,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled,
}: {
  prefix: React.ReactNode
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
}) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--ct-text-3)', pointerEvents: 'none', display: 'flex',
      }}>
        {prefix}
      </span>
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`ct-input${disabled ? '' : ''}`}
        style={{
          paddingLeft: 34,
          opacity: disabled ? 0.55 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
          background: disabled ? 'rgba(255,255,255,0.03)' : undefined,
        }}
      />
    </div>
  )
}

// ─── Change Password Modal ────────────────────────────────────────────────────

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const validate = () => {
    if (!current) return 'Current password is required.'
    if (next.length < 8) return 'New password must be at least 8 characters.'
    if (next !== confirm) return 'Passwords do not match.'
    return ''
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/settings/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Update failed.')
      }
      setDone(true)
      setTimeout(onClose, 1200)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setSaving(false)
    }
  }

  const strength = (() => {
    if (!next) return 0
    let s = 0
    if (next.length >= 8) s++
    if (/[A-Z]/.test(next)) s++
    if (/[0-9]/.test(next)) s++
    if (/[^A-Za-z0-9]/.test(next)) s++
    return s
  })()
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', '#EF4444', '#F59E0B', '#3B82F6', '#22C55E'][strength]

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--card)', border: '1px solid var(--ct-border-md)',
        borderRadius: 14, boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '20px 24px', borderBottom: '1px solid var(--ct-border)',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <KeyRound size={15} style={{ color: '#60A5FA' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ct-text)' }}>Change Password</p>
            <p style={{ fontSize: 11, color: 'var(--ct-text-3)', marginTop: 1 }}>Keep your account secure with a strong password.</p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Current password */}
          <Field label="Current Password">
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                className="ct-input"
                style={{ paddingRight: 38 }}
                placeholder="Enter current password"
                value={current}
                onChange={e => setCurrent(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(v => !v)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', color: 'var(--ct-text-3)',
                  cursor: 'pointer', display: 'flex', padding: 2,
                }}
              >
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>

          {/* New password */}
          <Field label="New Password">
            <div style={{ position: 'relative' }}>
              <input
                type={showNext ? 'text' : 'password'}
                className="ct-input"
                style={{ paddingRight: 38 }}
                placeholder="At least 8 characters"
                value={next}
                onChange={e => setNext(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNext(v => !v)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', color: 'var(--ct-text-3)',
                  cursor: 'pointer', display: 'flex', padding: 2,
                }}
              >
                {showNext ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {/* Strength bar */}
            {next && (
              <div style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i <= strength ? strengthColor : 'var(--ct-surface-2)',
                      transition: 'background 200ms',
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: 10, color: strengthColor }}>{strengthLabel}</p>
              </div>
            )}
          </Field>

          {/* Confirm */}
          <Field label="Confirm New Password">
            <input
              type="password"
              className={`ct-input${confirm && confirm !== next ? ' error' : ''}`}
              placeholder="Re-enter new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
            {confirm && confirm !== next && (
              <p style={{ fontSize: 11, color: 'var(--ct-error)' }}>Passwords do not match.</p>
            )}
          </Field>

          {error && (
            <p style={{
              fontSize: 12, color: 'var(--ct-error)',
              padding: '8px 10px', borderRadius: 6,
              background: 'var(--ct-error-bg)', border: '1px solid var(--ct-error-border)',
            }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 10, justifyContent: 'flex-end',
          padding: '0 24px 20px',
        }}>
          <button onClick={onClose} style={{
            height: 36, padding: '0 16px', borderRadius: 8,
            border: '1px solid var(--ct-border)', background: 'transparent',
            color: 'var(--ct-text-2)', fontSize: 13, cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || done}
            style={{
              height: 36, padding: '0 18px', borderRadius: 8, border: 'none',
              background: done ? '#166534' : 'var(--ct-blue)',
              color: '#fff', fontSize: 13, fontWeight: 500,
              cursor: saving || done ? 'default' : 'pointer',
              opacity: saving ? 0.75 : 1,
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'background 300ms',
            }}
          >
            {done
              ? <><Check size={13} />Password updated</>
              : saving
              ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Updating…</>
              : <><KeyRound size={13} />Update Password</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Save Button ──────────────────────────────────────────────────────────────

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function SaveButton({ state, onClick }: { state: SaveState; onClick: () => void }) {
  const styles: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 7,
    height: 38, padding: '0 18px', borderRadius: 9, border: 'none',
    fontSize: 13, fontWeight: 600, cursor: state === 'idle' ? 'pointer' : 'default',
    transition: 'background 300ms, box-shadow 200ms',
    color: '#fff',
    background:
      state === 'saved' ? '#166534' :
      state === 'error' ? '#7f1d1d' :
      state === 'saving' ? 'var(--ct-blue-hover)' :
      'var(--ct-blue)',
    boxShadow: state === 'saved'
      ? '0 0 0 2px rgba(34,197,94,0.3)'
      : state === 'idle'
      ? '0 2px 8px rgba(37,99,235,0.3)'
      : 'none',
    opacity: state === 'saving' ? 0.75 : 1,
  }
  return (
    <button onClick={onClick} disabled={state !== 'idle'} style={styles}>
      {state === 'saving' && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
      {state === 'saved'  && <Check   size={13} />}
      {state === 'error'  && <span style={{ fontSize: 13 }}>✕</span>}
      {state === 'idle'   && <Save    size={13} />}
      {state === 'saving' ? 'Saving…' :
       state === 'saved'  ? 'Saved'   :
       state === 'error'  ? 'Failed — Retry' :
       'Save Profile'}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  initial: SettingsData
}

export function SettingsClient({ initial }: Props) {
  const [orgName, setOrgName] = useState(initial.orgName)
  const [socialLink, setSocialLink] = useState(initial.socialLink ?? '')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDirty =
    orgName.trim() !== initial.orgName ||
    socialLink.trim() !== (initial.socialLink ?? '')

  const handleSave = async () => {
    if (saveState !== 'idle') return
    if (!orgName.trim()) return

    setSaveState('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)

    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName: orgName.trim(),
          socialLink: socialLink.trim() || null,
        }),
      })
      if (!res.ok) throw new Error()
      setSaveState('saved')
      saveTimer.current = setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
      saveTimer.current = setTimeout(() => setSaveState('idle'), 2500)
    }
  }

  // ── Shared section card style ──────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: 'var(--card)',
    border: '1px solid var(--ct-border)',
    borderRadius: 14,
    overflow: 'hidden',
  }
  const cardHeader: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '18px 24px', borderBottom: '1px solid var(--ct-border)',
  }
  const iconBox = (color: string, bg: string, border: string): React.CSSProperties => ({
    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
    background: bg, border: `1px solid ${border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <header style={{
        height: 64, display: 'flex', alignItems: 'center',
        padding: '0 32px', borderBottom: '1px solid var(--ct-border)', flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ct-text)' }}>Profile Settings</h1>
          <p style={{ fontSize: 12, color: 'var(--ct-text-3)', marginTop: 1 }}>
            Manage your organization details, public links, and security preferences.
          </p>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '28px 32px',
        display: 'flex', flexDirection: 'column', gap: 20,
        maxWidth: 680,
      }}>

        {/* ── Organization Details Card ─────────────────────────────────────── */}
        <div style={card}>
          {/* Card header */}
          <div style={cardHeader}>
            <div style={iconBox('#60A5FA', 'rgba(37,99,235,0.12)', 'rgba(37,99,235,0.25)')}>
              <Building2 size={14} style={{ color: '#60A5FA' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ct-text)' }}>Organization Details</p>
              <p style={{ fontSize: 11, color: 'var(--ct-text-3)', marginTop: 1 }}>
                Your public-facing profile information.
              </p>
            </div>
          </div>

          {/* Fields */}
          <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Org name */}
            <Field label="Organization Name">
              <PrefixedInput
                prefix={<Building2 size={13} />}
                value={orgName}
                onChange={setOrgName}
                placeholder="e.g. Google Developer Group KL"
              />
            </Field>

            {/* Social link */}
            <Field
              label="Social / Website Link"
              caption="Shown on public certificate pages as your organization link."
            >
              <PrefixedInput
                prefix={<Link2 size={13} />}
                value={socialLink}
                onChange={setSocialLink}
                placeholder="https://yourwebsite.com"
                type="url"
              />
            </Field>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--ct-border)', margin: '2px 0' }} />

            {/* Organizer code — read-only */}
            <Field
              label="Organizer Code"
              caption="Your unique organizer identifier. This cannot be changed."
            >
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--ct-text-3)', pointerEvents: 'none', display: 'flex',
                }}>
                  <Hash size={13} />
                </span>
                <input
                  readOnly
                  value={initial.organizerCd}
                  className="ct-input"
                  style={{
                    paddingLeft: 34, cursor: 'default',
                    background: 'rgba(255,255,255,0.03)',
                    opacity: 0.6, fontFamily: 'monospace',
                    letterSpacing: '0.05em',
                  }}
                />
              </div>
            </Field>

            {/* Email — read-only */}
            <Field label="Email Address">
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--ct-text-3)', pointerEvents: 'none', display: 'flex',
                }}>
                  <Mail size={13} />
                </span>
                <input
                  readOnly
                  value={initial.email}
                  className="ct-input"
                  style={{
                    paddingLeft: 34, paddingRight: 38, cursor: 'not-allowed',
                    background: 'rgba(255,255,255,0.03)',
                    opacity: 0.6,
                  }}
                />
                <span style={{
                  position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                  display: 'flex',
                }}>
                  <Lock size={12} style={{ color: 'var(--ct-text-3)' }} />
                </span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--ct-text-3)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 0 }}>
                <Lock size={10} />
                Email address cannot be changed for security reasons.
              </p>
            </Field>

          </div>

          {/* Save action footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 24px', borderTop: '1px solid var(--ct-border)',
            background: 'rgba(255,255,255,0.015)',
          }}>
            <p style={{ fontSize: 11, color: 'var(--ct-text-3)' }}>
              {isDirty && saveState === 'idle'
                ? 'You have unsaved changes.'
                : saveState === 'saved'
                ? 'All changes saved.'
                : ' '}
            </p>
            <SaveButton state={saveState} onClick={handleSave} />
          </div>
        </div>

        {/* ── Security Card ─────────────────────────────────────────────────── */}
        <div style={card}>
          <div style={cardHeader}>
            <div style={iconBox('#A78BFA', 'rgba(139,92,246,0.12)', 'rgba(139,92,246,0.25)')}>
              <ShieldCheck size={14} style={{ color: '#A78BFA' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ct-text)' }}>Security &amp; Credentials</p>
              <p style={{ fontSize: 11, color: 'var(--ct-text-3)', marginTop: 1 }}>
                Manage your password and authentication settings.
              </p>
            </div>
          </div>

          <div style={{ padding: '20px 24px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 10,
              border: '1px solid var(--ct-border)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: 'rgba(139,92,246,0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <KeyRound size={13} style={{ color: '#A78BFA' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ct-text)' }}>Password</p>
                  <p style={{ fontSize: 11, color: 'var(--ct-text-3)', marginTop: 1 }}>
                    Last changed: unknown
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  height: 34, padding: '0 14px', borderRadius: 8,
                  border: '1px solid var(--ct-border-md)', background: 'transparent',
                  color: 'var(--ct-text-2)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  transition: 'border-color 150ms, color 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#A78BFA44'; e.currentTarget.style.color = '#A78BFA' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--ct-border-md)'; e.currentTarget.style.color = 'var(--ct-text-2)' }}
              >
                Change Password
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ height: 8 }} />
      </div>

      {/* ── Password Modal ───────────────────────────────────────────────────── */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
