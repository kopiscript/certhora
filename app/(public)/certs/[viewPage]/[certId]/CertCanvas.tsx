'use client'

import { useRef, useState } from 'react'
import { Download, Award, FileBadge } from 'lucide-react'

interface Props {
  certId: string
  participantName: string
  hasBadge: boolean
  badgeUrl: string | null
  primaryColor: string
  templateVersion: number
}

export default function CertCanvas({ certId, participantName, hasBadge, badgeUrl, primaryColor, templateVersion }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [active, setActive] = useState(false)
  const [view, setView] = useState<'cert' | 'badge'>('cert')
  const showBadge = hasBadge && !!badgeUrl && view === 'badge'
  // Cache-busts the rendered image whenever the template changes — see page.tsx.
  const previewSrc = `/api/certs/${certId}/preview?v=${templateVersion}`

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    // Touch devices have no real hover — skip the tilt so the cert stays put
    // instead of getting stuck mid-tilt from a stray synthetic mousemove.
    if (typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches) return
    const rect = containerRef.current!.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x, y })
    setActive(true)
  }

  function onMouseLeave() {
    setTilt({ x: 0, y: 0 })
    setActive(false)
  }

  const transform = active
    ? `perspective(1100px) rotateY(${tilt.x * 14}deg) rotateX(${-tilt.y * 10}deg) scale(1.025) translateZ(12px)`
    : 'perspective(1100px) rotateY(0deg) rotateX(0deg) scale(1) translateZ(0px)'

  const shadow = active
    ? `0 ${28 + tilt.y * 18}px 80px rgba(0,0,0,0.75), 0 ${8 + tilt.y * 6}px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)`
    : '0 20px 60px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)'

  return (
    <div style={{ position: 'relative' }}>

      {/* View toggle — only shown when this event has a badge to switch to */}
      {hasBadge && badgeUrl && (
        <div
          role="tablist"
          aria-label="View certificate or badge"
          style={{
            display: 'inline-flex', gap: 2, marginBottom: 14, padding: 3,
            borderRadius: 10, background: 'var(--ct-surface)', border: '1px solid var(--ct-border)',
          }}
        >
          {(['cert', 'badge'] as const).map(v => {
            const isActive = view === v
            return (
              <button
                key={v}
                role="tab"
                aria-selected={isActive}
                onClick={() => setView(v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 16px', borderRadius: 8, border: 'none',
                  background: isActive ? 'var(--ct-blue)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--ct-text-2)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'background 150ms ease, color 150ms ease',
                }}
              >
                {v === 'cert' ? <FileBadge size={15} /> : <Award size={15} />}
                {v === 'cert' ? 'Certificate' : 'Badge'}
              </button>
            )
          })}
        </div>
      )}

      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: '-60px -40px',
          background: `radial-gradient(ellipse at 50% 55%, ${primaryColor}28 0%, ${primaryColor}0a 40%, transparent 68%)`,
          filter: 'blur(48px)',
          pointerEvents: 'none',
          zIndex: 0,
          borderRadius: '50%',
        }}
      />

      {showBadge ? (
        /* Badge — shown as a floating medallion, not a document card: the shadow follows
           the badge's own silhouette (via drop-shadow on the image) instead of a hard
           rectangular box, and it lifts gently on hover instead of the certificate's 3-D
           tilt (which only reads correctly on a flat rectangular document). */
        <div
          style={{
            position: 'relative', zIndex: 1,
            display: 'flex', justifyContent: 'center',
            padding: '48px 0',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={badgeUrl!}
            alt="Digital badge"
            draggable={false}
            style={{
              width: '38%',
              minWidth: 160,
              maxWidth: 280,
              height: 'auto',
              filter: 'drop-shadow(0 18px 34px rgba(0,0,0,0.55)) drop-shadow(0 2px 6px rgba(0,0,0,0.35))',
              transition: 'transform 0.3s cubic-bezier(0.23,1,0.32,1), filter 0.3s ease',
              cursor: 'default',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.06) translateY(-4px)'
              e.currentTarget.style.filter = 'drop-shadow(0 26px 44px rgba(0,0,0,0.6)) drop-shadow(0 4px 10px rgba(0,0,0,0.4))'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1) translateY(0)'
              e.currentTarget.style.filter = 'drop-shadow(0 18px 34px rgba(0,0,0,0.55)) drop-shadow(0 2px 6px rgba(0,0,0,0.35))'
            }}
          />
        </div>
      ) : (
        /* 3-D tilt container — certificate document */
        <div
          ref={containerRef}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          style={{
            position: 'relative',
            zIndex: 1,
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.10)',
            transform,
            transition: active
              ? 'transform 0.08s ease-out, box-shadow 0.08s ease-out'
              : 'transform 0.55s cubic-bezier(0.23,1,0.32,1), box-shadow 0.55s cubic-bezier(0.23,1,0.32,1)',
            boxShadow: shadow,
            transformStyle: 'preserve-3d',
            cursor: 'default',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewSrc}
            alt={`Certificate for ${participantName}`}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            draggable={false}
          />

          {/* Specular shine layer */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background: active
                ? `linear-gradient(${110 + tilt.x * 30}deg, rgba(255,255,255,0.00) 35%, rgba(255,255,255,0.045) 50%, rgba(255,255,255,0.00) 65%)`
                : 'none',
              pointerEvents: 'none',
              transition: 'background 0.1s ease-out',
            }}
          />
        </div>
      )}

      {/* Actions row */}
      <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
        <a
          href={`/api/certs/${certId}/download`}
          download
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            height: 46, borderRadius: 10,
            background: 'var(--ct-blue)',
            color: '#fff',
            fontWeight: 600, fontSize: 14,
            textDecoration: 'none',
            letterSpacing: '0.01em',
            transition: 'background 150ms ease',
            border: 'none',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--ct-blue-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--ct-blue)')}
        >
          <Download size={16} />
          {hasBadge && badgeUrl ? 'Download Certificate + Badge (.zip)' : 'Download Certificate'}
        </a>
      </div>
    </div>
  )
}
