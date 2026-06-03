'use client'

import { useRef, useState } from 'react'
import { Download, Award } from 'lucide-react'

interface Props {
  certId: string
  participantName: string
  hasBadge: boolean
  badgeUrl: string | null
  primaryColor: string
}

export default function CertCanvas({ certId, participantName, hasBadge, badgeUrl, primaryColor }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [active, setActive] = useState(false)

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
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

      {/* 3-D tilt container */}
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
          src={`/api/certs/${certId}/preview`}
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

        {/* Badge overlay */}
        {hasBadge && badgeUrl && (
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              right: 14,
              width: 68,
              height: 68,
              borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.18)',
              overflow: 'hidden',
              boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={badgeUrl} alt="Digital badge" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
      </div>

      {/* Actions row */}
      <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
        <a
          href={`/api/certs/${certId}/preview`}
          download={`certificate-${certId}.png`}
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
          Download Certificate
        </a>

        {hasBadge && (
          <a
            href={`/api/certs/${certId}/badge`}
            download={`badge-${certId}.png`}
            title="Download Badge"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 46, height: 46, borderRadius: 10,
              background: 'var(--ct-surface)',
              border: '1px solid var(--ct-border)',
              color: 'var(--ct-text-2)',
              textDecoration: 'none',
              transition: 'border-color 150ms ease, color 150ms ease',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
              e.currentTarget.style.color = 'var(--ct-text)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--ct-border)'
              e.currentTarget.style.color = 'var(--ct-text-2)'
            }}
          >
            <Award size={16} />
          </a>
        )}
      </div>
    </div>
  )
}
