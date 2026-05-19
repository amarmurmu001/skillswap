'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log to error monitoring (e.g. Sentry) in production
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0a0a0f', color: '#f0f0ff', fontFamily: 'system-ui,sans-serif' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}>
          <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72,
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>

            <h1 style={{ fontWeight: 800, fontSize: '1.75rem', marginBottom: '0.75rem' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#a0a0c0', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              An unexpected error occurred. Please try again — if the problem persists, contact support.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <pre style={{
                textAlign: 'left',
                background: 'rgba(17,17,24,0.9)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '0.875rem',
                padding: '1rem',
                fontSize: '0.75rem',
                color: '#f87171',
                overflow: 'auto',
                marginBottom: '1.5rem',
                maxHeight: 180,
              }}>
                {error?.message}
              </pre>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => reset()}
                style={{
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color: 'white',
                  fontWeight: 600,
                  padding: '0.75rem 1.75rem',
                  borderRadius: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Try Again
              </button>
              <a
                href="/"
                style={{
                  background: 'transparent',
                  color: '#818cf8',
                  fontWeight: 600,
                  padding: '0.75rem 1.75rem',
                  borderRadius: '0.875rem',
                  border: '1px solid rgba(99,102,241,0.4)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                }}
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
