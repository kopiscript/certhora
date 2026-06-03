'use client'

import { useEffect, useState } from 'react'
import { Star, Send, CheckCircle2, Loader2 } from 'lucide-react'

const LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
}

interface Props {
  eventCode: string
  eventName: string
}

export default function FeedbackForm({ eventCode, eventName }: Props) {
  const [hovered, setHovered] = useState(0)
  const [selected, setSelected] = useState(0)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)

  const storageKey = `feedback_${eventCode}`

  useEffect(() => {
    if (localStorage.getItem(storageKey)) setAlreadySubmitted(true)
  }, [storageKey])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || status === 'loading') return
    setStatus('loading')

    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventCode, npsScore: selected, comment }),
    })

    if (res.ok) {
      localStorage.setItem(storageKey, '1')
      setStatus('done')
    } else {
      setStatus('idle')
    }
  }

  const activeRating = hovered || selected

  if (alreadySubmitted || status === 'done') {
    return (
      <div
        style={{
          background: 'var(--ct-surface)',
          border: '1px solid rgba(34,197,94,0.22)',
          borderRadius: 14,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(34,197,94,0.10)',
            border: '1px solid rgba(34,197,94,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <CheckCircle2 size={22} style={{ color: '#22C55E' }} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ct-text)', margin: 0 }}>
          Thank you for your feedback!
        </p>
        <p style={{ fontSize: 13, color: 'var(--ct-text-2)', margin: 0 }}>
          Your rating helps improve future events.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'var(--ct-surface)',
        border: '1px solid var(--ct-border)',
        borderRadius: 14,
        padding: 24,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <p
          style={{
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--ct-text-2)', margin: '0 0 6px',
          }}
        >
          Rate Your Experience
        </p>
        <p style={{ fontSize: 13, color: 'var(--ct-text-3)', margin: 0, lineHeight: 1.5 }}>
          How was <span style={{ color: 'var(--ct-text-2)', fontWeight: 500 }}>{eventName}</span>?
        </p>
      </div>

      {/* Stars */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 6,
        }}
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            onClick={() => setSelected(i)}
            onMouseEnter={() => setHovered(i)}
            aria-label={`Rate ${i} star${i > 1 ? 's' : ''}`}
            style={{
              background: 'none',
              border: 'none',
              padding: 2,
              cursor: 'pointer',
              transition: 'transform 120ms ease',
              transform: activeRating >= i ? 'scale(1.15)' : 'scale(1)',
              lineHeight: 0,
            }}
          >
            <Star
              size={30}
              fill={activeRating >= i ? '#FBBF24' : 'none'}
              strokeWidth={1.8}
              style={{
                color: activeRating >= i ? '#FBBF24' : 'rgba(255,255,255,0.18)',
                transition: 'color 100ms ease, fill 100ms ease',
                filter: activeRating >= i ? 'drop-shadow(0 0 6px rgba(251,191,36,0.45))' : 'none',
              }}
            />
          </button>
        ))}
      </div>

      {/* Label */}
      <p
        style={{
          fontSize: 12, fontWeight: 600,
          color: activeRating ? '#FBBF24' : 'var(--ct-text-3)',
          margin: '0 0 16px',
          minHeight: 18,
          transition: 'color 100ms ease',
        }}
      >
        {activeRating ? LABELS[activeRating] : 'Select a rating'}
      </p>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Share your thoughts about the event or organizer… (optional)"
        rows={3}
        maxLength={500}
        style={{
          width: '100%',
          background: 'var(--ct-surface-2)',
          border: '1px solid var(--ct-border)',
          borderRadius: 9,
          padding: '10px 13px',
          fontSize: 13,
          color: 'var(--ct-text)',
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'inherit',
          lineHeight: 1.6,
          boxSizing: 'border-box',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
        }}
        onFocus={e => {
          e.target.style.borderColor = 'var(--ct-blue)'
          e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)'
        }}
        onBlur={e => {
          e.target.style.borderColor = 'var(--ct-border)'
          e.target.style.boxShadow = 'none'
        }}
      />

      {comment.length > 400 && (
        <p style={{ fontSize: 11, color: 'var(--ct-text-3)', margin: '4px 0 0', textAlign: 'right' }}>
          {500 - comment.length} characters remaining
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!selected || status === 'loading'}
        style={{
          marginTop: 14,
          width: '100%',
          height: 42,
          borderRadius: 9,
          background: selected ? 'var(--ct-blue)' : 'var(--ct-surface-2)',
          border: `1px solid ${selected ? 'transparent' : 'var(--ct-border)'}`,
          color: selected ? '#fff' : 'var(--ct-text-3)',
          fontSize: 13, fontWeight: 600,
          cursor: selected ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          transition: 'background 150ms ease, color 150ms ease, border-color 150ms ease',
          letterSpacing: '0.01em',
        }}
        onMouseEnter={e => { if (selected) e.currentTarget.style.background = 'var(--ct-blue-hover)' }}
        onMouseLeave={e => { if (selected) e.currentTarget.style.background = 'var(--ct-blue)' }}
      >
        {status === 'loading'
          ? <><Loader2 size={14} className="animate-spin" /> Submitting…</>
          : <><Send size={14} /> Submit Feedback</>}
      </button>
    </form>
  )
}
