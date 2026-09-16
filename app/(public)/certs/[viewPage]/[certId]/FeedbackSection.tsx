'use client'

import { useState } from 'react'
import { MessageSquare, X } from 'lucide-react'
import FeedbackForm from './FeedbackForm'

interface Props {
  eventCode: string
  eventName: string
}

// On mobile the feedback form is long (stars + textarea + submit) and pushes
// the rest of the page down — show a trigger button instead and let the form
// open as a closable popup, while desktop keeps it inline as before.
export default function FeedbackSection({ eventCode, eventName }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="hidden sm:block">
        <FeedbackForm eventCode={eventCode} eventName={eventName} />
      </div>

      <button
        onClick={() => setOpen(true)}
        className="sm:hidden"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', height: 46, borderRadius: 10,
          background: 'var(--ct-surface)', border: '1px solid var(--ct-border)',
          color: 'var(--ct-text)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}
      >
        <MessageSquare size={16} />
        Rate Your Experience
      </button>

      {open && (
        <div
          className="sm:hidden"
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            style={{
              width: '100%', maxHeight: '88vh', overflowY: 'auto',
              background: 'var(--ct-bg)', borderRadius: '16px 16px 0 0',
              padding: '14px 16px 24px',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: '1px solid var(--ct-border)', background: 'var(--ct-surface)',
                  color: 'var(--ct-text-2)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={15} />
              </button>
            </div>
            <FeedbackForm eventCode={eventCode} eventName={eventName} />
          </div>
        </div>
      )}
    </>
  )
}
