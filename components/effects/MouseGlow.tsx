'use client';

import { useEffect, useRef } from 'react';

export default function MouseGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId: number;

    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!el) return;
        el.style.background = `radial-gradient(350px circle at ${e.clientX}px ${e.clientY}px, rgba(99,102,241,0.09) 0%, rgba(79,70,229,0.04) 50%, transparent 70%)`;
      });
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-0 z-20 hidden md:block"
      style={{ mixBlendMode: 'lighten', transition: 'none' }}
    />
  );
}
