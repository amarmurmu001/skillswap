'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const router  = useRouter();
  const [form, setForm]     = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [ready, setReady]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Supabase sends the user here with a token in the URL hash.
  // onAuthStateChange fires with event=PASSWORD_RECOVERY when the token is valid.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: form.password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated! Please sign in.');
      router.push('/auth/login');
    }
  }

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', zIndex: 1 }}>
        <div className="mesh-bg" />
        <div style={{ textAlign: 'center', color: '#a0a0c0' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '0.9rem' }}>Verifying your reset link…</p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#6b7280' }}>
            If this takes too long,{' '}
            <Link href="/auth/forgot-password" style={{ color: '#818cf8', textDecoration: 'none' }}>request a new link</Link>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>
      <div className="mesh-bg" />
      <div style={{ width: '100%', maxWidth: 440 }}>
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
          <h1 style={{ fontFamily: 'var(--font-outfit,Outfit),sans-serif', fontWeight: 800, fontSize: '1.75rem', marginBottom: '0.5rem', textAlign: 'center' }}>
            Set new password
          </h1>
          <p style={{ color: '#a0a0c0', fontSize: '0.9rem', textAlign: 'center', marginBottom: '2rem' }}>
            Choose a strong password for your account.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '0.5rem' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  minLength={8}
                  autoFocus
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a0a0c0' }}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '0.5rem' }}>Confirm Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field"
                placeholder="Repeat your password"
                value={form.confirm}
                onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                required
              />
              {form.confirm && form.password !== form.confirm && (
                <p style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.4rem' }}>Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || form.password !== form.confirm}
              style={{ width: '100%', opacity: (loading || form.password !== form.confirm) ? 0.6 : 1 }}
            >
              <span>{loading ? 'Updating…' : 'Update Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
