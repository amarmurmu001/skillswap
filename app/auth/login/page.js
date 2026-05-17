'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const router     = useRouter();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Welcome back! 🎉');
      router.push('/dashboard');
    }
  }

  function demoLogin() {
    setForm({ email: 'arjun@example.com', password: 'password123' });
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#6366f1,#d946ef)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>⚡</div>
            <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f0ff' }}>
              Skill<span style={{ color: '#818cf8' }}>Swap</span>
            </span>
          </Link>
        </div>

        <div className="glass-card" style={{ padding: '2.5rem' }}>
          <h1 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.75rem', marginBottom: '0.5rem', textAlign: 'center' }}>Welcome back</h1>
          <p style={{ color: '#a0a0c0', fontSize: '0.9rem', textAlign: 'center', marginBottom: '2rem' }}>Sign in to your SkillSwap account</p>

          {/* Demo shortcut */}
          <button
            onClick={demoLogin}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(99,102,241,0.08)',
              border: '1px dashed rgba(99,102,241,0.3)',
              borderRadius: '0.875rem',
              color: '#818cf8',
              fontSize: '0.85rem',
              cursor: 'pointer',
              marginBottom: '1.5rem',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
          >
            🎭 Use demo credentials
          </button>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '0.5rem' }}>Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '0.5rem' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a0a0c0', fontSize: '1rem' }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.25rem', opacity: loading ? 0.7 : 1 }}
            >
              <span>{loading ? '⟳ Signing in…' : '→ Sign In'}</span>
            </button>
          </form>

          <p style={{ textAlign: 'center', color: '#a0a0c0', fontSize: '0.875rem', marginTop: '1.5rem' }}>
            Don't have an account?{' '}
            <Link href="/auth/register" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>
              Create one free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
