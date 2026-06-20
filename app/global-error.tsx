'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background: '#030712',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center', padding: '0 16px' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#f87171', letterSpacing: '0.1em', marginBottom: 12 }}>500</p>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ color: '#9ca3af', marginBottom: 28, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={() => unstable_retry()}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 500, color: '#fff', background: '#4f46e5',
              padding: '10px 20px', borderRadius: 999, border: 'none', cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
