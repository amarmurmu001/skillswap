'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { updateUser } from '@/lib/data';
import toast from 'react-hot-toast';

/**
 * OnboardingModal — shown to new users whose skill lists are empty.
 * Walks through 3 steps: skills to teach → skills to learn → bio/location.
 * Marks the user as onboarded by saving their selections.
 */
export default function OnboardingModal({ onComplete }) {
  const { user, refreshUser } = useAuth();
  const { skills, refreshUsers } = useAppData();
  const [step, setStep]   = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    skillsOffered: [],
    skillsWanted:  [],
    bio:      '',
    location: '',
  });

  const categories = [...new Set(skills.map(s => s.category))];

  function toggleSkill(id, key) {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter(x => x !== id) : [...prev[key], id],
    }));
  }

  async function handleFinish() {
    setSaving(true);
    try {
      await updateUser(user.id, form);
      await refreshUser();
      await refreshUsers();
      toast.success('Profile set up! Welcome to SkillSwap.');
      onComplete();
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const STEPS = [
    { title: 'What can you teach?', subtitle: 'Select all skills you can share with others.', key: 'skillsOffered', color: '#6366f1' },
    { title: 'What do you want to learn?', subtitle: 'Select skills you'd like to learn from others.', key: 'skillsWanted', color: '#d946ef' },
    { title: 'About you', subtitle: 'A short bio and location help others find and trust you.', key: null, color: '#818cf8' },
  ];

  const current = STEPS[step - 1];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(10,10,15,0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        width: '100%', maxWidth: 560,
        background: '#111118',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: '1.5rem',
        overflow: 'hidden',
        boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(99,102,241,0.15)' }}>
          <div style={{ height: '100%', width: `${(step / 3) * 100}%`, background: `linear-gradient(90deg,#6366f1,#d946ef)`, transition: 'width 0.4s ease' }} />
        </div>

        <div style={{ padding: '2rem' }}>
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ flex: 1, height: 4, borderRadius: 9999, background: n <= step ? `linear-gradient(90deg,#6366f1,#d946ef)` : 'rgba(99,102,241,0.15)', transition: 'background 0.3s' }} />
            ))}
          </div>

          <div style={{ marginBottom: '0.25rem', fontSize: '0.78rem', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Step {step} of 3
          </div>
          <h2 style={{ fontFamily: 'var(--font-outfit,Outfit),sans-serif', fontWeight: 800, fontSize: '1.4rem', marginBottom: '0.5rem' }}>{current.title}</h2>
          <p style={{ color: '#a0a0c0', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{current.subtitle}</p>

          {/* Step 1 & 2: skill picker */}
          {current.key && (
            <div style={{ maxHeight: 280, overflowY: 'auto', paddingRight: '0.25rem' }}>
              {categories.map(cat => {
                const catSkills = skills.filter(s => s.category === cat);
                return (
                  <div key={cat} style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>{cat}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {catSkills.map(s => {
                        const selected = form[current.key].includes(s.id);
                        return (
                          <button
                            key={s.id}
                            onClick={() => toggleSkill(s.id, current.key)}
                            style={{
                              padding: '0.3rem 0.75rem',
                              borderRadius: 9999,
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              background: selected ? `${current.color}20` : 'rgba(17,17,24,0.8)',
                              color: selected ? current.color : '#a0a0c0',
                              border: `1px solid ${selected ? `${current.color}40` : 'rgba(99,102,241,0.12)'}`,
                            }}
                          >
                            {selected && '✓ '}{s.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Step 3: bio + location */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '0.4rem' }}>Short bio</label>
                <textarea
                  className="input-field"
                  placeholder="Tell others what you're passionate about…"
                  rows={3}
                  value={form.bio}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  style={{ resize: 'none', fontFamily: 'var(--font-inter,Inter),sans-serif' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '0.4rem' }}>Location (optional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Mumbai, India"
                  value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem', alignItems: 'center' }}>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary" style={{ fontSize: '0.875rem' }}>
                Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)} className="btn-primary" style={{ fontSize: '0.875rem' }}>
                <span>Continue →</span>
              </button>
            ) : (
              <button onClick={handleFinish} disabled={saving} className="btn-primary" style={{ fontSize: '0.875rem', opacity: saving ? 0.7 : 1 }}>
                <span>{saving ? 'Saving…' : 'Complete Setup'}</span>
              </button>
            )}
          </div>

          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.78rem', color: '#6b7280' }}>
            You can always update this later in{' '}
            <Link href="/profile" style={{ color: '#818cf8', textDecoration: 'none' }}>your profile</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
