'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Download, ChevronDown, ChevronLeft, ChevronRight,
  Edit2, ExternalLink, X, Check, Loader2, Users, Filter, Send,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmailStatus = 'PENDING' | 'QUEUED' | 'SENT' | 'FAILED' | 'BOUNCED'

export interface CertRow {
  certId: string
  participantName: string
  participantEmail: string
  eventCode: string
  emailStatus: EmailStatus
  createdAt: string
}

export interface EventOption {
  eventCode: string
  eventName: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

export const MOCK_CERTS: CertRow[] = [
  { certId: 'ABC123DEF456', participantName: 'Ahmad Faris',       participantEmail: 'ahmad.faris@gmail.com',    eventCode: 'GDG2025',   emailStatus: 'SENT',    createdAt: '2025-03-15T10:30:00Z' },
  { certId: 'XYZ789GHI012', participantName: 'Nurul Aina',        participantEmail: 'nurul.aina@outlook.com',   eventCode: 'GDG2025',   emailStatus: 'SENT',    createdAt: '2025-03-15T10:31:00Z' },
  { certId: 'MNO345PQR678', participantName: 'Muhammad Haziq',    participantEmail: 'haziq@yahoo.com',          eventCode: 'GDG2025',   emailStatus: 'PENDING', createdAt: '2025-03-15T10:32:00Z' },
  { certId: 'JKL678STU901', participantName: 'Siti Nabilah',      participantEmail: 'siti.nabilah@email.com',   eventCode: 'GDG2025',   emailStatus: 'FAILED',  createdAt: '2025-03-15T10:33:00Z' },
  { certId: 'VWX234YZA567', participantName: 'Danial Azri',       participantEmail: 'danial.azri@proton.me',    eventCode: 'GDG2025',   emailStatus: 'QUEUED',  createdAt: '2025-03-15T10:34:00Z' },
  { certId: 'BCD890EFG123', participantName: 'Izzatul Husna',     participantEmail: 'izzatul@gmail.com',        eventCode: 'DEVFEST25', emailStatus: 'SENT',    createdAt: '2025-04-02T09:00:00Z' },
  { certId: 'HIJ456KLM789', participantName: 'Khairul Anwar',     participantEmail: 'khairul.anwar@work.io',    eventCode: 'DEVFEST25', emailStatus: 'SENT',    createdAt: '2025-04-02T09:01:00Z' },
  { certId: 'NOP012QRS345', participantName: 'Farah Liyana',      participantEmail: 'farah.ly@hotmail.com',     eventCode: 'DEVFEST25', emailStatus: 'BOUNCED', createdAt: '2025-04-02T09:02:00Z' },
  { certId: 'TUV678WXY901', participantName: 'Amirul Hakim',      participantEmail: 'amirul.h@gmail.com',       eventCode: 'DEVFEST25', emailStatus: 'PENDING', createdAt: '2025-04-02T09:03:00Z' },
  { certId: 'ZAB234CDE567', participantName: 'Nurul Syafiqah',    participantEmail: 'nsyafiqah@email.my',       eventCode: 'DEVFEST25', emailStatus: 'SENT',    createdAt: '2025-04-02T09:04:00Z' },
  { certId: 'FGH890IJK123', participantName: 'Irfan Zulkifli',    participantEmail: 'irfan.zk@icloud.com',      eventCode: 'HACKUTM25', emailStatus: 'SENT',    createdAt: '2025-05-10T14:00:00Z' },
  { certId: 'LMN456OPQ789', participantName: 'Afiq Danish',       participantEmail: 'afiq.danish@student.utm.my', eventCode: 'HACKUTM25', emailStatus: 'SENT',  createdAt: '2025-05-10T14:01:00Z' },
  { certId: 'RST012UVW345', participantName: 'Wan Zulaikha',      participantEmail: 'wzulaikha@gmail.com',      eventCode: 'HACKUTM25', emailStatus: 'FAILED',  createdAt: '2025-05-10T14:02:00Z' },
  { certId: 'XYZ678ABC901', participantName: 'Hana Fateha',       participantEmail: 'hana.fateha@yahoo.com',    eventCode: 'HACKUTM25', emailStatus: 'PENDING', createdAt: '2025-05-10T14:03:00Z' },
  { certId: 'DEF234GHI567', participantName: 'Rifqi Ramadhan',    participantEmail: 'rifqi.r@outlook.my',       eventCode: 'HACKUTM25', emailStatus: 'QUEUED',  createdAt: '2025-05-10T14:04:00Z' },
  { certId: 'JKL890MNO123', participantName: 'Zahra Balqis',      participantEmail: 'zahra.b@gmail.com',        eventCode: 'CT2026',    emailStatus: 'PENDING', createdAt: '2025-06-01T08:00:00Z' },
  { certId: 'PQR456STU789', participantName: 'Hari Krishnan',     participantEmail: 'hari.k@tech.io',           eventCode: 'CT2026',    emailStatus: 'PENDING', createdAt: '2025-06-01T08:01:00Z' },
  { certId: 'VWX012YZA345', participantName: 'Li Wei',            participantEmail: 'liwei.cs@hotmail.com',     eventCode: 'CT2026',    emailStatus: 'SENT',    createdAt: '2025-06-01T08:02:00Z' },
  { certId: 'BCD678EFG901', participantName: 'Priya Devi',        participantEmail: 'priya.d@email.in',         eventCode: 'CT2026',    emailStatus: 'FAILED',  createdAt: '2025-06-01T08:03:00Z' },
  { certId: 'HIJ234KLM567', participantName: 'Tengku Aqil',       participantEmail: 'aqil.tengku@gmail.com',    eventCode: 'CT2026',    emailStatus: 'BOUNCED', createdAt: '2025-06-01T08:04:00Z' },
  { certId: 'NOP890QRS123', participantName: 'Adibah Ramli',      participantEmail: 'adibah.r@proton.me',       eventCode: 'GDG2025',   emailStatus: 'SENT',    createdAt: '2025-03-15T11:00:00Z' },
  { certId: 'TUV456WXY789', participantName: 'Zikri Luqman',      participantEmail: 'zikri.l@gmail.com',        eventCode: 'DEVFEST25', emailStatus: 'QUEUED',  createdAt: '2025-04-02T10:00:00Z' },
  { certId: 'ZAB012CDE345', participantName: 'Amira Sofea',       participantEmail: 'amira.sofea@email.com',    eventCode: 'HACKUTM25', emailStatus: 'SENT',    createdAt: '2025-05-10T15:00:00Z' },
  { certId: 'FGH678IJK901', participantName: 'Arif Syahmi',       participantEmail: 'arif.syahmi@yahoo.com',    eventCode: 'CT2026',    emailStatus: 'PENDING', createdAt: '2025-06-01T09:00:00Z' },
  { certId: 'LMN234OPQ567', participantName: 'Shafiqah Hayati',   participantEmail: 'shafiqah.h@outlook.com',   eventCode: 'GDG2025',   emailStatus: 'FAILED',  createdAt: '2025-03-15T12:00:00Z' },
]

const MOCK_EVENTS: EventOption[] = [
  { eventCode: 'GDG2025',   eventName: 'GDG Kuala Lumpur 2025' },
  { eventCode: 'DEVFEST25', eventName: 'DevFest Malaysia 2025' },
  { eventCode: 'HACKUTM25', eventName: 'Hackathon UTM 2025' },
  { eventCode: 'CT2026',    eventName: 'Certhora Launch 2026' },
]

// ─── Badge configs ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<EmailStatus, { label: string; bg: string; color: string; dot: string }> = {
  PENDING: { label: 'Pending', bg: 'rgba(251,191,36,0.10)',  color: '#FCD34D', dot: '#F59E0B' },
  QUEUED:  { label: 'Queued',  bg: 'rgba(96,165,250,0.10)', color: '#93C5FD', dot: '#3B82F6' },
  SENT:    { label: 'Sent',    bg: 'rgba(74,222,128,0.10)', color: '#6EE7B7', dot: '#22C55E' },
  FAILED:  { label: 'Failed',  bg: 'rgba(248,113,113,0.10)',color: '#FCA5A5', dot: '#EF4444' },
  BOUNCED: { label: 'Bounced', bg: 'rgba(248,113,113,0.10)',color: '#FCA5A5', dot: '#EF4444' },
}

const EVENT_COLORS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
  '#EC4899', '#06B6D4', '#84CC16',
]
function eventColor(code: string) {
  let hash = 0
  for (let i = 0; i < code.length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash)
  return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length]

}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('en-MY', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(iso))
}

function buildCsv(rows: CertRow[]) {
  const headers = ['Cert ID', 'Name', 'Email', 'Event Code', 'Email Status', 'Created At']
  const lines = rows.map(r => [
    r.certId, r.participantName, r.participantEmail,
    r.eventCode, r.emailStatus, fmtDate(r.createdAt),
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  return [headers.join(','), ...lines].join('\n')
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function getPageNumbers(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (page <= 4) return [1, 2, 3, 4, 5, '…', total]
  if (page >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '…', page - 1, page, page + 1, '…', total]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: EmailStatus }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.PENDING
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 6,
      background: cfg.bg, fontSize: 11, fontWeight: 600,
      letterSpacing: '0.03em', color: cfg.color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

function EventBadge({ code }: { code: string }) {
  const color = eventColor(code)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 999,
      background: `${color}18`, border: `1px solid ${color}35`,
      color, fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
      fontFamily: 'monospace',
    }}>
      {code}
    </span>
  )
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  cert: CertRow
  onClose: () => void
  onSave: (certId: string, name: string, email: string) => Promise<void>
}

function EditModal({ cert, onClose, onSave }: EditModalProps) {
  const [name, setName] = useState(cert.participantName)
  const [email, setEmail] = useState(cert.participantEmail)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required.'); return }
    if (!email.trim() || !email.includes('@')) { setError('Valid email is required.'); return }
    setSaving(true); setError('')
    try {
      await onSave(cert.certId, name.trim(), email.trim())
      onClose()
    } catch {
      setError('Failed to save. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: 420, background: 'var(--card)', border: '1px solid var(--ct-border-md)',
        borderRadius: 14, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ct-text)' }}>Edit Participant</p>
            <p style={{ fontSize: 12, color: 'var(--ct-text-3)', marginTop: 2, fontFamily: 'monospace' }}>{cert.certId}</p>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 6, border: '1px solid var(--ct-border)',
            background: 'transparent', color: 'var(--ct-text-3)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="ct-label">Full Name</label>
            <input
              ref={nameRef}
              className="ct-input"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>
          <div>
            <label className="ct-label">Email Address</label>
            <input
              className="ct-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>
          {error && (
            <p style={{ fontSize: 12, color: 'var(--ct-error)', padding: '8px 10px', borderRadius: 6, background: 'var(--ct-error-bg)', border: '1px solid var(--ct-error-border)' }}>
              {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            height: 36, padding: '0 16px', borderRadius: 8,
            border: '1px solid var(--ct-border)', background: 'transparent',
            color: 'var(--ct-text-2)', fontSize: 13, cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            height: 36, padding: '0 18px', borderRadius: 8,
            background: saving ? 'var(--ct-blue-hover)' : 'var(--ct-blue)',
            border: 'none', color: '#fff', fontSize: 13, fontWeight: 500,
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {saving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Saving…</> : <><Check size={13} />Save changes</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Export Dropdown ──────────────────────────────────────────────────────────

interface ExportDropdownProps {
  allCerts: CertRow[]
  events: EventOption[]
  onClose: () => void
}

function ExportDropdown({ allCerts, events, onClose }: ExportDropdownProps) {
  const [mode, setMode] = useState<'all' | 'event'>('all')
  const [eventCode, setEventCode] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose])

  const handleExport = () => {
    const rows = mode === 'all'
      ? allCerts
      : allCerts.filter(c => c.eventCode === eventCode)
    if (rows.length === 0) return
    const filename = mode === 'all'
      ? `participants-all-${Date.now()}.csv`
      : `participants-${eventCode}-${Date.now()}.csv`
    downloadCsv(buildCsv(rows), filename)
    onClose()
  }

  return (
    <div ref={ref} style={{
      position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50,
      width: 280, background: 'var(--card)', border: '1px solid var(--ct-border-md)',
      borderRadius: 10, boxShadow: '0 12px 40px rgba(0,0,0,0.4)', padding: 14,
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ct-text-3)', marginBottom: 10 }}>
        Export as CSV
      </p>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {(['all', 'event'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex: 1, height: 30, borderRadius: 6, fontSize: 12, fontWeight: 500,
            border: '1px solid var(--ct-border)',
            background: mode === m ? 'var(--ct-blue-dim)' : 'transparent',
            color: mode === m ? '#93C5FD' : 'var(--ct-text-2)',
            cursor: 'pointer',
          }}>
            {m === 'all' ? 'All Events' : 'By Event'}
          </button>
        ))}
      </div>

      {mode === 'event' && (
        <div style={{ marginBottom: 12 }}>
          <label className="ct-label">Event</label>
          <div style={{ position: 'relative' }}>
            <select
              value={eventCode}
              onChange={e => setEventCode(e.target.value)}
              style={{
                width: '100%', height: 36, background: 'var(--ct-surface-2)',
                border: '1px solid var(--ct-border)', borderRadius: 8,
                padding: '0 30px 0 10px', fontSize: 13, color: 'var(--ct-text)',
                cursor: 'pointer', appearance: 'none',
              }}
            >
              <option value="">Select event…</option>
              {events.map(e => (
                <option key={e.eventCode} value={e.eventCode}>
                  {e.eventCode} — {e.eventName}
                </option>
              ))}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ct-text-3)', pointerEvents: 'none' }} />
          </div>
        </div>
      )}

      <button onClick={handleExport} disabled={mode === 'event' && !eventCode} style={{
        width: '100%', height: 34, borderRadius: 7, border: 'none',
        background: 'var(--ct-blue)', color: '#fff', fontSize: 13, fontWeight: 500,
        cursor: (mode === 'event' && !eventCode) ? 'not-allowed' : 'pointer',
        opacity: (mode === 'event' && !eventCode) ? 0.45 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <Download size={13} />
        Download CSV
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  events: EventOption[]
  initialCerts: CertRow[]
}

export function ParticipantsClient({ events: propEvents, initialCerts }: Props) {
  const router = useRouter()

  // Use real data if available, fall back to mock
  const data = initialCerts.length > 0 ? initialCerts : MOCK_CERTS
  const events = propEvents.length > 0 ? propEvents : MOCK_EVENTS

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // ── Pagination ───────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  // ── Edit modal ───────────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<CertRow | null>(null)
  const [rows, setRows] = useState<CertRow[]>(data)

  // ── Export dropdown ──────────────────────────────────────────────────────────
  const [showExport, setShowExport] = useState(false)
  const exportBtnRef = useRef<HTMLDivElement>(null)

  // ── Send emails (per-event bulk, or a manual cross-event selection) ───────────
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Keep rows in sync with initialCerts prop changes
  useEffect(() => {
    setRows(initialCerts.length > 0 ? initialCerts : MOCK_CERTS)
  }, [initialCerts])

  // ── Derived data ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rows.filter(r => {
      if (eventFilter && r.eventCode !== eventFilter) return false
      if (statusFilter && r.emailStatus !== statusFilter) return false
      if (q && !r.participantName.toLowerCase().includes(q) && !r.participantEmail.toLowerCase().includes(q)) return false
      return true
    })
  }, [rows, search, eventFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(page, totalPages)

  const paginated = useMemo(() => {
    const start = (safePage - 1) * perPage
    return filtered.slice(start, start + perPage)
  }, [filtered, safePage, perPage])

  const pageNums = getPageNumbers(safePage, totalPages)

  // Reset to page 1 on filter change
  const setFilter = useCallback((fn: () => void) => { fn(); setPage(1) }, [])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSave = async (certId: string, name: string, email: string) => {
    const res = await fetch(`/api/participants/${certId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantName: name, participantEmail: email }),
    })
    if (!res.ok) throw new Error('Save failed')
    setRows(prev => prev.map(r => r.certId === certId ? { ...r, participantName: name, participantEmail: email } : r))
  }

  const queuedForEvent = useMemo(
    () => eventFilter
      ? rows.filter(r => r.eventCode === eventFilter && ['QUEUED', 'FAILED', 'BOUNCED'].includes(r.emailStatus)).length
      : 0,
    [rows, eventFilter]
  )

  const selectedCount = selectedIds.size

  const toggleSelect = useCallback((certId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(certId)) next.delete(certId)
      else next.add(certId)
      return next
    })
  }, [])

  const pageAllSelected = paginated.length > 0 && paginated.every(r => selectedIds.has(r.certId))
  const pageSomeSelected = paginated.some(r => selectedIds.has(r.certId))

  const toggleSelectPage = useCallback(() => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (pageAllSelected) {
        paginated.forEach(r => next.delete(r.certId))
      } else {
        paginated.forEach(r => next.add(r.certId))
      }
      return next
    })
  }, [pageAllSelected, paginated])

  const handleSendEmails = async () => {
    if (sending) return

    if (selectedCount > 0) {
      setSending(true); setSendError('')
      try {
        const res = await fetch('/api/participants/send-emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ certIds: Array.from(selectedIds) }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setSelectedIds(new Set())
        router.refresh()
      } catch (err) {
        setSendError((err as Error).message)
      } finally {
        setSending(false)
      }
      return
    }

    if (!eventFilter || queuedForEvent === 0) return
    setSending(true); setSendError('')
    try {
      const res = await fetch(`/api/events/${eventFilter}/send-emails`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.refresh()
    } catch (err) {
      setSendError((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  // ── Range text ───────────────────────────────────────────────────────────────
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * perPage + 1
  const rangeEnd = Math.min(safePage * perPage, filtered.length)

  // ── Shared select style ──────────────────────────────────────────────────────
  const selStyle: React.CSSProperties = {
    height: 36, background: 'var(--ct-surface-2)', border: '1px solid var(--ct-border)',
    borderRadius: 8, padding: '0 30px 0 10px', fontSize: 13, color: 'var(--ct-text)',
    cursor: 'pointer', appearance: 'none', flexShrink: 0,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <header style={{
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', borderBottom: '1px solid var(--ct-border)', flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ct-text)' }}>Participants</h1>
          <p style={{ fontSize: 12, color: 'var(--ct-text-3)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
            <Users size={11} />
            {rows.length.toLocaleString()} total record{rows.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Send emails: manual selection takes priority over the per-event bulk send */}
          {(() => {
            const sendDisabled = sending || (selectedCount === 0 && queuedForEvent === 0)
            const tooltip = sendError || (selectedCount === 0 && queuedForEvent === 0 ? 'Select participants, or pick an event with sendable certificates' : undefined)
            return (
              <button
                onClick={handleSendEmails}
                disabled={sendDisabled}
                title={tooltip}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  height: 36, padding: '0 14px',
                  background: sendDisabled ? 'var(--ct-surface-2)' : 'var(--ct-blue)',
                  color: sendDisabled ? 'var(--ct-text-3)' : 'white',
                  border: 'none', borderRadius: 8,
                  fontSize: 13, fontWeight: 500,
                  cursor: sendDisabled ? 'not-allowed' : 'pointer',
                  opacity: sendDisabled ? 0.6 : 1,
                }}
              >
                {sending
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</>
                  : selectedCount > 0
                    ? <><Send size={14} /> Send Selected ({selectedCount})</>
                    : <><Send size={14} /> Send Emails{eventFilter ? ` (${queuedForEvent})` : ''}</>}
              </button>
            )
          })()}

          {/* Export button */}
          <div ref={exportBtnRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExport(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                height: 36, padding: '0 14px', background: 'var(--ct-blue)',
                color: 'white', border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              <Download size={14} />
              Export CSV
              <ChevronDown size={12} style={{ marginLeft: 2, opacity: 0.8 }} />
            </button>
            {showExport && (
              <ExportDropdown
                allCerts={rows}
                events={events}
                onClose={() => setShowExport(false)}
              />
            )}
          </div>
        </div>
      </header>

      {/* ── Filter Bar ───────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 10, padding: '14px 32px',
        borderBottom: '1px solid var(--ct-border)', flexShrink: 0,
        background: 'var(--background)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
          <Search size={13} style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--ct-text-3)', pointerEvents: 'none',
          }} />
          <input
            style={{
              width: '100%', height: 36, background: 'var(--ct-surface-2)',
              border: '1px solid var(--ct-border)', borderRadius: 8,
              padding: '0 10px 0 32px', fontSize: 13, color: 'var(--ct-text)',
              outline: 'none',
            }}
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setFilter(() => setSearch(e.target.value))}
          />
        </div>

        {/* Event filter */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select style={{ ...selStyle, width: 170 }} value={eventFilter} onChange={e => setFilter(() => setEventFilter(e.target.value))}>
            <option value="">All Events</option>
            {events.map(ev => <option key={ev.eventCode} value={ev.eventCode}>{ev.eventCode}</option>)}
          </select>
          <ChevronDown size={13} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--ct-text-3)', pointerEvents: 'none' }} />
        </div>

        {/* Status filter */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select style={{ ...selStyle, width: 145 }} value={statusFilter} onChange={e => setFilter(() => setStatusFilter(e.target.value))}>
            <option value="">All Statuses</option>
            {(Object.keys(STATUS_CFG) as EmailStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_CFG[s].label}</option>
            ))}
          </select>
          <ChevronDown size={13} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--ct-text-3)', pointerEvents: 'none' }} />
        </div>

        {/* Active filter chips */}
        {(search || eventFilter || statusFilter) && (
          <button
            onClick={() => { setSearch(''); setEventFilter(''); setStatusFilter(''); setPage(1) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, height: 36, padding: '0 12px',
              borderRadius: 8, border: '1px solid var(--ct-border)', background: 'transparent',
              color: 'var(--ct-text-3)', fontSize: 12, cursor: 'pointer',
            }}
          >
            <X size={12} />Clear filters
          </button>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {paginated.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 10, height: 280,
          }}>
            <Filter size={28} style={{ color: 'var(--ct-text-3)' }} />
            <p style={{ fontSize: 14, color: 'var(--ct-text-2)' }}>No participants match your filters</p>
            <button onClick={() => { setSearch(''); setEventFilter(''); setStatusFilter(''); setPage(1) }}
              style={{
                height: 32, padding: '0 14px', borderRadius: 7, border: '1px solid var(--ct-border)',
                background: 'transparent', color: 'var(--ct-text-2)', fontSize: 12, cursor: 'pointer',
              }}>
              Clear filters
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--ct-border)' }}>
                <th style={{
                  padding: '10px 16px', textAlign: 'left', width: 1,
                  background: 'var(--background)', position: 'sticky', top: 0,
                }}>
                  <input
                    type="checkbox"
                    checked={pageAllSelected}
                    ref={el => { if (el) el.indeterminate = !pageAllSelected && pageSomeSelected }}
                    onChange={toggleSelectPage}
                    style={{ accentColor: 'var(--ct-blue)', cursor: 'pointer' }}
                  />
                </th>
                {['Participant', 'Cert ID', 'Event', 'Email Status', 'Actions'].map(col => (
                  <th key={col} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'var(--ct-text-3)',
                    background: 'var(--background)', position: 'sticky', top: 0,
                    whiteSpace: 'nowrap',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((row, idx) => (
                <tr
                  key={row.certId}
                  style={{
                    borderBottom: '1px solid var(--ct-border)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.014)',
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--ct-blue-dim)')}
                  onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.014)')}
                >
                  {/* Select */}
                  <td style={{ padding: '12px 16px', width: 1 }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.certId)}
                      onChange={() => toggleSelect(row.certId)}
                      style={{ accentColor: 'var(--ct-blue)', cursor: 'pointer' }}
                    />
                  </td>

                  {/* Participant info */}
                  <td style={{ padding: '12px 16px', minWidth: 220 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: `${eventColor(row.eventCode)}22`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: eventColor(row.eventCode),
                      }}>
                        {row.participantName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 500, color: 'var(--ct-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.participantName}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--ct-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                          {row.participantEmail}
                        </p>
                      </div>
                      <button
                        onClick={() => setEditTarget(row)}
                        title="Edit participant"
                        style={{
                          width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                          border: '1px solid var(--ct-border)', background: 'transparent',
                          color: 'var(--ct-text-3)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginLeft: 'auto',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ct-blue)'; e.currentTarget.style.color = '#93C5FD' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--ct-border)'; e.currentTarget.style.color = 'var(--ct-text-3)' }}
                      >
                        <Edit2 size={11} />
                      </button>
                    </div>
                  </td>

                  {/* Cert ID */}
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      fontFamily: 'monospace', fontSize: 12,
                      color: 'var(--ct-text-2)', letterSpacing: '0.04em',
                      background: 'var(--ct-surface-2)', padding: '3px 8px',
                      borderRadius: 5, border: '1px solid var(--ct-border)',
                    }}>
                      {row.certId}
                    </span>
                  </td>

                  {/* Event */}
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <EventBadge code={row.eventCode} />
                  </td>

                  {/* Email status */}
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <StatusBadge status={row.emailStatus} />
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <a
                      href={`/certs/view/${row.certId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        height: 30, padding: '0 12px', borderRadius: 7,
                        border: '1px solid var(--ct-border)', background: 'transparent',
                        color: 'var(--ct-text-2)', fontSize: 12, fontWeight: 500,
                        textDecoration: 'none', cursor: 'pointer',
                        transition: 'border-color 150ms, color 150ms',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ct-blue)'; e.currentTarget.style.color = '#93C5FD' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--ct-border)'; e.currentTarget.style.color = 'var(--ct-text-2)' }}
                    >
                      <ExternalLink size={11} />
                      View Cert
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination Footer ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        padding: '12px 32px', borderTop: '1px solid var(--ct-border)', flexShrink: 0,
        background: 'var(--background)',
      }}>
        {/* Range info */}
        <p style={{ fontSize: 12, color: 'var(--ct-text-3)', whiteSpace: 'nowrap' }}>
          {filtered.length === 0
            ? 'No results'
            : `Showing ${rangeStart}–${rangeEnd} of ${filtered.length.toLocaleString()} participant${filtered.length !== 1 ? 's' : ''}`}
        </p>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Rows per page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--ct-text-3)', whiteSpace: 'nowrap' }}>Rows</span>
            <div style={{ position: 'relative' }}>
              <select
                value={perPage}
                onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                style={{ ...selStyle, width: 68 }}
              >
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <ChevronDown size={11} style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', color: 'var(--ct-text-3)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: 'var(--ct-border)' }} />

          {/* Prev */}
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            style={{
              width: 30, height: 30, borderRadius: 7, border: '1px solid var(--ct-border)',
              background: 'transparent', color: 'var(--ct-text-2)', cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
              opacity: safePage <= 1 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ChevronLeft size={14} />
          </button>

          {/* Page numbers */}
          <div style={{ display: 'flex', gap: 4 }}>
            {pageNums.map((n, i) =>
              n === '…' ? (
                <span key={`ellipsis-${i}`} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--ct-text-3)' }}>
                  …
                </span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n as number)}
                  style={{
                    width: 30, height: 30, borderRadius: 7, border: '1px solid',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    borderColor: n === safePage ? 'var(--ct-blue)' : 'var(--ct-border)',
                    background: n === safePage ? 'var(--ct-blue-dim)' : 'transparent',
                    color: n === safePage ? '#93C5FD' : 'var(--ct-text-2)',
                  }}
                >
                  {n}
                </button>
              )
            )}
          </div>

          {/* Next */}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            style={{
              width: 30, height: 30, borderRadius: 7, border: '1px solid var(--ct-border)',
              background: 'transparent', color: 'var(--ct-text-2)', cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
              opacity: safePage >= totalPages ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Edit Modal ───────────────────────────────────────────────────────── */}
      {editTarget && (
        <EditModal
          cert={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSave}
        />
      )}

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
