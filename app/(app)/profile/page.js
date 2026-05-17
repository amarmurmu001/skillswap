'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getSkills, getSkillsByIds, updateUser,
  getReviewsForUser, getUserById,
} from '@/lib/data';
import SkillTag from '@/components/SkillTag';
import StarRating from '@/components/StarRating';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState(null);
  const [skillMode, setSkillMode] = useState('offer');
  const [search, setSearch]   = useState('');

  if (!user) return null;

  const allSkills = getSkills();
  const reviews   = getReviewsForUser(user.id);
  const offeredSkills = getSkillsByIds(user.skillsOffered);
  const wantedSkills  = getSkillsByIds(user.skillsWanted);

  function startEdit() {
    setForm({ name: user.name, bio: user.bio, location: user.location, skillsOffered: [...user.skillsOffered], skillsWanted: [...user.skillsWanted] });
    setEditing(true);
  }

  function save() {
    updateUser(user.id, form);
    refreshUser();
    setEditing(false);
    toast.success('Profile updated! ✅');
  }

  function toggleSkill(id) {
    if (!form) return;
    const key = skillMode === 'offer' ? 'skillsOffered' : 'skillsWanted';
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter(x => x !== id) : [...prev[key], id],
    }));
  }

  const filteredSkills = allSkills.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(allSkills.map(s => s.category))];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Profile header */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <img
            src={user.avatar}
            alt={user.name}
            style={{ width: 100, height: 100, borderRadius: '50%', background: '#1a1a27', border: '3px solid rgba(99,102,241,0.4)' }}
          />
          <div style={{
            position: 'absolute', bottom: 4, right: 4,
            width: 14, height: 14, background: '#4ade80',
            borderRadius: '50%', border: '2px solid #0a0a0f',
          }} />
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          {editing ? (
            <input
              className="input-field"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              style={{ marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: 700 }}
            />
          ) : (
            <h1 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.6rem', marginBottom: '0.25rem' }}>{user.name}</h1>
          )}

          {editing ? (
            <input
              className="input-field"
              value={form.location}
              onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
              placeholder="Your location"
              style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}
            />
          ) : (
            <div style={{ color: '#a0a0c0', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              {user.location ? `📍 ${user.location}` : '🌍 Worldwide'}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <StarRating value={Math.round(user.rating)} readonly size="sm" />
            <span style={{ fontSize: '0.82rem', color: '#a0a0c0' }}>
              {user.rating.toFixed(1)} · {user.totalReviews} reviews
            </span>
            <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
              Joined {formatDate(user.joinedAt)}
            </span>
          </div>

          {editing ? (
            <textarea
              className="input-field"
              value={form.bio}
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              placeholder="Tell others about yourself..."
              rows={3}
              style={{ resize: 'vertical', fontFamily: 'Inter,sans-serif' }}
            />
          ) : (
            user.bio && <p style={{ color: '#a0a0c0', fontSize: '0.875rem', lineHeight: 1.6 }}>{user.bio}</p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.625rem' }}>
          {editing ? (
            <>
              <button onClick={save} className="btn-primary" style={{ fontSize: '0.875rem' }}>
                <span>Save Changes</span>
              </button>
              <button onClick={() => setEditing(false)} className="btn-secondary" style={{ fontSize: '0.875rem' }}>
                Cancel
              </button>
            </>
          ) : (
            <button onClick={startEdit} className="btn-secondary" style={{ fontSize: '0.875rem' }}>
              ✏️ Edit Profile
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Skills section */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>Skills</h2>

          {editing ? (
            <div>
              {/* Mode toggle */}
              <div style={{ display: 'flex', background: 'rgba(17,17,24,0.9)', borderRadius: '0.875rem', padding: '0.2rem', marginBottom: '0.875rem', border: '1px solid rgba(99,102,241,0.15)' }}>
                {[['offer', '🎓 Teaching', '#6366f1'], ['want', '🌱 Learning', '#d946ef']].map(([key, label, color]) => (
                  <button
                    key={key}
                    onClick={() => setSkillMode(key)}
                    style={{
                      flex: 1, padding: '0.5rem', borderRadius: '0.7rem',
                      background: skillMode === key ? `${color}20` : 'transparent',
                      border: skillMode === key ? `1px solid ${color}40` : '1px solid transparent',
                      color: skillMode === key ? color : '#a0a0c0',
                      fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <input
                className="input-field"
                placeholder="🔍 Search skills..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ marginBottom: '0.875rem' }}
              />

              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {categories.map(cat => {
                  const catSkills = filteredSkills.filter(s => s.category === cat);
                  if (!catSkills.length) return null;
                  return (
                    <div key={cat} style={{ marginBottom: '0.875rem' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>{cat}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {catSkills.map(s => {
                          const key = skillMode === 'offer' ? 'skillsOffered' : 'skillsWanted';
                          const selected = form?.[key]?.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              onClick={() => toggleSkill(s.id)}
                              style={{
                                padding: '0.3rem 0.75rem',
                                borderRadius: 9999,
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: selected ? (skillMode === 'offer' ? 'rgba(99,102,241,0.2)' : 'rgba(217,70,239,0.15)') : 'rgba(17,17,24,0.8)',
                                color: selected ? (skillMode === 'offer' ? '#818cf8' : '#e879f9') : '#a0a0c0',
                                border: selected ? `1px solid ${skillMode === 'offer' ? 'rgba(99,102,241,0.4)' : 'rgba(217,70,239,0.35)'}` : '1px solid rgba(99,102,241,0.12)',
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
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>
                  🎓 Teaching ({offeredSkills.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {offeredSkills.length === 0
                    ? <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>No skills added yet</span>
                    : offeredSkills.map(s => <SkillTag key={s.id} skill={s} variant="offer" />)
                  }
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d946ef', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>
                  🌱 Learning ({wantedSkills.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {wantedSkills.length === 0
                    ? <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>No skills added yet</span>
                    : wantedSkills.map(s => <SkillTag key={s.id} skill={s} variant="want" />)
                  }
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reviews section */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>
            Reviews ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#a0a0c0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⭐</div>
              <div style={{ fontSize: '0.875rem' }}>No reviews yet</div>
              <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Complete sessions to get reviews</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map(r => {
                const reviewer = getUserById(r.reviewerId);
                return (
                  <div key={r.id} style={{ padding: '1rem', background: 'rgba(17,17,24,0.6)', borderRadius: '0.875rem', border: '1px solid rgba(99,102,241,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem' }}>
                      {reviewer && <img src={reviewer.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a1a27' }} />}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{reviewer?.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <StarRating value={r.rating} readonly size="sm" />
                          {r.skillTaught && <span style={{ fontSize: '0.72rem', color: '#818cf8' }}>{r.skillTaught}</span>}
                        </div>
                      </div>
                    </div>
                    {r.comment && <p style={{ color: '#a0a0c0', fontSize: '0.82rem', lineHeight: 1.5, fontStyle: 'italic' }}>"{r.comment}"</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
