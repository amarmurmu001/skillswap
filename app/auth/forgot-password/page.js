'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>
      <div className="mesh-bg" />
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#6366f1,#d946ef)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <span style={{ fontFamily: 'var(--font-outfit,Outfit),sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f0ff' }}>
              Skill<span style={{ color: '#818cf8' }}>Swap</span>
            </span>
          </Link>
        </div>

        <div className="glass-card" style={{ padding: '2.5rem' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h1 style={{ fontFamily: 'var(--font-outfit,Outfit),sans-serif', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.75rem' }}>Check your email</h1>
              <p style={{ color: '#a0a0c0', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                We sent a password reset link to <strong style={{ color: '#f0f0ff' }}>{email}</strong>.
                Check your inbox and click the link to continue.
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.82rem' }}>
                Didn't receive it?{' '}
                <button onClick={() => setSent(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#818cf8', fontWeight: 600, padding: 0 }}>
                  Try again
                </button>
              </p>
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily: 'var(--font-outfit,Outfit),sans-serif', fontWeight: 800, fontSize: '1.75rem', marginBottom: '0.5rem', textAlign: 'center' }}>Reset password</h1>
              <p style={{ color: '#a0a0c0', fontSize: '0.9rem', textAlign: 'center', marginBottom: '2rem' }}>
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '0.5rem' }}>Email address</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{ width: '100%', opacity: loading ? 0.7 : 1 }}
                >
                  <span>{loading ? 'Sending…' : 'Send Reset Link'}</span>
                </button>
              </form>
            </>
          )}

          <p style={{ textAlign: 'center', color: '#a0a0c0', fontSize: '0.875rem', marginTop: '1.5rem' }}>
            <Link href="/auth/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>
              ← Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
