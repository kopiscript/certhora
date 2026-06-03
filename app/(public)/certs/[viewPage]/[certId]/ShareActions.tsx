'use client'

import { useEffect, useState } from 'react'
import { Link2, Check, ExternalLink } from 'lucide-react'

function LinkedInIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

interface Props {
  certId: string
  participantName: string
  eventName: string
  organizerName: string
  organizerSocialLink: string | null
}

export default function ShareActions({ certId, participantName, eventName, organizerName, organizerSocialLink }: Props) {
  const [pageUrl, setPageUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setPageUrl(window.location.href)
  }, [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pageUrl || window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // fallback — select a temp input
    }
  }

  const shareText = encodeURIComponent(
    `I earned a verified certificate for "${eventName}" — powered by Certhora.`
  )
  const encodedUrl = encodeURIComponent(pageUrl)

  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
  const twitterHref = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`

  const btnBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    height: 42,
    borderRadius: 9,
    paddingInline: 16,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'none',
    border: '1px solid transparent',
    transition: 'opacity 150ms ease, filter 150ms ease',
    letterSpacing: '0.01em',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Share credentials ── */}
      <div
        style={{
          background: 'var(--ct-surface)',
          border: '1px solid var(--ct-border)',
          borderRadius: 14,
          padding: 22,
        }}
      >
        <p
          style={{
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ct-text-2)',
            margin: '0 0 14px',
          }}
        >
          Share Credentials
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Copy link */}
          <button
            onClick={handleCopy}
            style={{
              ...btnBase,
              background: copied ? 'rgba(34,197,94,0.12)' : 'var(--ct-surface-2)',
              border: `1px solid ${copied ? 'rgba(34,197,94,0.25)' : 'var(--ct-border)'}`,
              color: copied ? '#4ade80' : 'var(--ct-text)',
              width: '100%',
            }}
          >
            {copied ? <Check size={15} /> : <Link2 size={15} />}
            {copied ? 'Link Copied!' : 'Copy Link'}
          </button>

          {/* LinkedIn */}
          <a
            href={linkedInHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...btnBase,
              background: '#0A66C2',
              color: '#fff',
            }}
            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
          >
            <LinkedInIcon />
            Add to LinkedIn
          </a>

          {/* X / Twitter */}
          <a
            href={twitterHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...btnBase,
              background: '#000',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff',
            }}
            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.2)')}
            onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
          >
            <XIcon />
            Share on X
          </a>
        </div>
      </div>

      {/* ── Connect with organizer ── */}
      {organizerSocialLink && (
        <div
          style={{
            background: 'var(--ct-surface)',
            border: '1px solid var(--ct-border)',
            borderRadius: 14,
            padding: 22,
          }}
        >
          <p
            style={{
              fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ct-text-2)',
              margin: '0 0 14px',
            }}
          >
            Connect with the Organizer
          </p>

          <a
            href={organizerSocialLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...btnBase,
              background: 'var(--ct-surface-2)',
              border: '1px solid var(--ct-border)',
              color: 'var(--ct-text)',
              width: '100%',
              justifyContent: 'space-between',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(37,99,235,0.35)'
              e.currentTarget.style.color = '#93C5FD'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--ct-border)'
              e.currentTarget.style.color = 'var(--ct-text)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              <span
                style={{
                  width: 26, height: 26,
                  borderRadius: 6,
                  background: 'var(--ct-blue-dim)',
                  border: '1px solid rgba(37,99,235,0.20)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: 'var(--ct-blue)',
                  flexShrink: 0,
                }}
              >
                {organizerName.charAt(0).toUpperCase()}
              </span>
              <span
                style={{
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontSize: 13,
                }}
              >
                {organizerName}
              </span>
            </span>
            <ExternalLink size={13} style={{ flexShrink: 0, opacity: 0.5 }} />
          </a>
        </div>
      )}
    </div>
  )
}
