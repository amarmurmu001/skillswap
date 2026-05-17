'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getSkills } from '@/lib/data';
import SkillTag from '@/components/SkillTag';
import toast from 'react-hot-toast';

const STEPS = ['Account', 'Profile', 'Skills'];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const allSkills = getSkills();

  const [step, setStep]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm]   = useState({
    name: '', email: '', password: '', bio: '', location: '',
    skillsOffered: [], skillsWanted: [],
  });
  const [search, setSearch] = useState('');
  const [mode, setMode]     = useState('offer'); // 'offer' | 'want'

  const filtered = allSkills.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(allSkills.map(s => s.category))];

  function toggleSkill(id) {
    const key = mode === 'offer' ? 'skillsOffered' : 'skillsWanted';
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter(x => x !== id) : [...prev[key], id],
    }));
  }

  async function handleSubmit() {
    setLoading(true);
    const result = await register(form);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Welcome to SkillSwap! 🎉');
      router.push('/dashboard');
    }
  }

  const canProceed = [
    form.name && form.email && form.password.length >= 6,
    true, // bio/location optional
    form.skillsOffered.length > 0 || form.skillsWanted.length > 0,
  ][step];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>
      <div style={{ width: '100%', maxWidth: step === 2 ? 620 : 460 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#6366f1,#d946ef)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>⚡</div>
            <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#f0f0ff' }}>
              Skill<span style={{ color: '#818cf8' }}>Swap</span>
            </span>
          </Link>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', justifyContent: 'center' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: 32, height: 32,
                borderRadius: '50%',
                background: i <= step ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(99,102,241,0.1)',
                border: `1px solid ${i <= step ? '#6366f1' : 'rgba(99,102,241,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700,
                color: i <= step ? '#fff' : '#6b7280',
                transition: 'all 0.3s',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: i === step ? '#c7d2fe' : '#6b7280' }}>{s}</span>
              {i < STEPS.length - 1 && <div style={{ width: 24, height: 1, background: 'rgba(99,102,241,0.2)' }} />}
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ padding: '2.5rem' }}>
          {/* Step 0: Account */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h1 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.6rem', marginBottom: '0.4rem' }}>Create your account</h1>
                <p style={{ color: '#a0a0c0', fontSize: '0.875rem' }}>Join the skill exchange community</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '0.5rem' }}>Full Name</label>
                <input type="text" className="input-field" placeholder="Arjun Mehta" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '0.5rem' }}>Email</label>
                <input type="email" className="input-field" placeholder="you@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '0.5rem' }}>Password</label>
                <input type="password" className="input-field" placeholder="Minimum 6 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                {form.password && form.password.length < 6 && (
                  <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: 4 }}>Password must be at least 6 characters</p>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Profile */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.6rem', marginBottom: '0.4rem' }}>Your Profile</h2>
                <p style={{ color: '#a0a0c0', fontSize: '0.875rem' }}>Tell the community about yourself</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '0.5rem' }}>Location (optional)</label>
                <input type="text" className="input-field" placeholder="e.g. Mumbai, India" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '0.5rem' }}>Bio (optional)</label>
                <textarea
                  className="input-field"
                  placeholder="Tell others what you're passionate about..."
                  value={form.bio}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  rows={4}
                  style={{ resize: 'vertical', fontFamily: 'Inter,sans-serif' }}
                />
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4, textAlign: 'right' }}>
                  {form.bio.length} / 500
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Skills */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.6rem', marginBottom: '0.4rem' }}>Your Skills</h2>
                <p style={{ color: '#a0a0c0', fontSize: '0.875rem' }}>Select what you can teach and what you want to learn</p>
              </div>

              {/* Mode toggle */}
              <div style={{ display: 'flex', background: 'rgba(17,17,24,0.9)', borderRadius: '0.875rem', padding: '0.25rem', marginBottom: '1rem', border: '1px solid rgba(99,102,241,0.15)' }}>
                {[['offer', '🎓 I can teach', '#6366f1'], ['want', '🌱 I want to learn', '#d946ef']].map(([key, label, color]) => (
                  <button
                    key={key}
                    onClick={() => setMode(key)}
                    style={{
                      flex: 1, padding: '0.625rem', borderRadius: '0.75rem',
                      background: mode === key ? `${color}20` : 'transparent',
                      border: mode === key ? `1px solid ${color}50` : '1px solid transparent',
                      color: mode === key ? color : '#a0a0c0',
                      fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {label}
                    {form[mode === key ? (key === 'offer' ? 'skillsOffered' : 'skillsWanted') : (key === 'offer' ? 'skillsOffered' : 'skillsWanted')].length > 0 && (
                      <span style={{ marginLeft: 6, background: color, color: '#fff', borderRadius: 9999, padding: '0 6px', fontSize: '0.7rem' }}>
                        {form[key === 'offer' ? 'skillsOffered' : 'skillsWanted'].length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <input
                type="text"
                className="input-field"
                placeholder="🔍 Search skills..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ marginBottom: '1rem' }}
              />

              <div style={{ maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
                {categories.map(cat => {
                  const catSkills = filtered.filter(s => s.category === cat);
                  if (!catSkills.length) return null;
                  return (
                    <div key={cat} style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{cat}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {catSkills.map(s => {
                          const key = mode === 'offer' ? 'skillsOffered' : 'skillsWanted';
                          const selected = form[key].includes(s.id);
                          return (
                            <button
                              key={s.id}
                              onClick={() => toggleSkill(s.id)}
                              style={{
                                padding: '0.35rem 0.875rem',
                                borderRadius: 9999,
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: selected
                                  ? (mode === 'offer' ? 'rgba(99,102,241,0.25)' : 'rgba(217,70,239,0.2)')
                                  : 'rgba(17,17,24,0.9)',
                                color: selected
                                  ? (mode === 'offer' ? '#818cf8' : '#e879f9')
                                  : '#a0a0c0',
                                border: selected
                                  ? `1px solid ${mode === 'offer' ? 'rgba(99,102,241,0.5)' : 'rgba(217,70,239,0.4)'}`
                                  : '1px solid rgba(99,102,241,0.15)',
                              }}
                            >
                              {selected ? '✓ ' : ''}{s.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(17,17,24,0.6)', borderRadius: '0.875rem', border: '1px solid rgba(99,102,241,0.12)' }}>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Teaching ({form.skillsOffered.length})</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {form.skillsOffered.length === 0
                        ? <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>None selected</span>
                        : allSkills.filter(s => form.skillsOffered.includes(s.id)).map(s =>
                            <SkillTag key={s.id} skill={s} variant="offer" size="sm" />
                          )
                      }
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#d946ef', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Learning ({form.skillsWanted.length})</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {form.skillsWanted.length === 0
                        ? <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>None selected</span>
                        : allSkills.filter(s => form.skillsWanted.includes(s.id)).map(s =>
                            <SkillTag key={s.id} skill={s} variant="want" size="sm" />
                          )
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
            {step > 0 && (
              <button className="btn-secondary" onClick={() => setStep(s => s - 1)} style={{ flex: 1 }}>
                ← Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                className="btn-primary"
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed}
                style={{ flex: 2, opacity: canProceed ? 1 : 0.5 }}
              >
                <span>Next →</span>
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={loading || (!form.skillsOffered.length && !form.skillsWanted.length)}
                style={{ flex: 2 }}
              >
                <span>{loading ? '⟳ Creating…' : '🚀 Join SkillSwap'}</span>
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#a0a0c0', fontSize: '0.875rem', marginTop: '1.25rem' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
