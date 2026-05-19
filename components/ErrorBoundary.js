'use client';

import React from 'react';
import Link from 'next/link';

/**
 * ErrorBoundary — catches any unhandled React render/lifecycle errors
 * and shows a friendly fallback instead of a blank white screen.
 *
 * Must be a class component (React requirement for error boundaries).
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production, send to Sentry:
    // Sentry.captureException(error, { extra: info });
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
        zIndex: 1,
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

          <h1 style={{ fontFamily: 'var(--font-outfit,Outfit),sans-serif', fontWeight: 800, fontSize: '1.75rem', marginBottom: '0.75rem', color: '#f0f0ff' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#a0a0c0', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            An unexpected error occurred. Our team has been notified.
            Try reloading the page — it usually fixes things.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre style={{
              textAlign: 'left', background: 'rgba(17,17,24,0.9)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '0.875rem', padding: '1rem',
              fontSize: '0.75rem', color: '#f87171',
              overflow: 'auto', marginBottom: '1.5rem', maxHeight: 200,
            }}>
              {this.state.error.toString()}
            </pre>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="btn-primary"
              style={{ fontSize: '0.875rem' }}
            >
              <span>Reload Page</span>
            </button>
            <Link href="/dashboard" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.875rem' }}>
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
