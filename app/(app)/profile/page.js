'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updateUser, getReviewsForUserWithReviewers } from '@/lib/data';
import { useAppData } from '@/context/AppDataContext';
import { supabase } from '@/lib/supabase';
import SkillTag from '@/components/SkillTag';
import StarRating from '@/components/StarRating';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const { skills: allSkills, ready, resolveSkills, refreshUsers } = useAppData();
  const [editing, setEditing]     = useState(false);
  const [form, setForm]           = useState(null);
  const [skillMode, setSkillMode] = useState('offer');
  const [search, setSearch]       = useState('');
  const [reviews, setReviews]     = useState([]);
  const [reviewers, setReviewers] = useState({});
  const [pageLoading, setPageLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting]   = useState(false);
  const fileInputRef = useRef(null);

  const offeredSkills = resolveSkills(user?.skillsOffered || []);
  const wantedSkills = resolveSkills(user?.skillsWanted || []);

  useEffect(() => {
    if (!user || !ready) return;
    getReviewsForUserWithReviewers(user.id)
      .then(({ reviews: rev, reviewers: r }) => {
        setReviews(rev);
        setReviewers(r);
      })
      .catch(() => toast.error('Failed to load reviews'))
      .finally(() => setPageLoading(false));
  }, [user?.id, ready]);

  if (!user) return null;

  if (!ready || pageLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  function startEdit() {
    setForm({ name: user.name, bio: user.bio, location: user.location, skillsOffered: [...user.skillsOffered], skillsWanted: [...user.skillsWanted] });
    setEditing(true);
  }

  async function save() {
    try {
      await updateUser(user.id, form);
      await refreshUser();
      await refreshUsers();
      setEditing(false);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to save profile');
    }
  }

  async function uploadAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2 MB'); return; }
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { toast.error('Only JPG, PNG or WebP accepted'); return; }
    setAvatarUploading(true);
    try {
      const ext  = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await updateUser(user.id, { avatar: publicUrl });
      await refreshUser();
      toast.success('Avatar updated!');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setAvatarUploading(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      // Delete profile row (cascade will clean up matches, messages, notifications)
      await supabase.from('profiles').delete().eq('id', user.id);
      // Delete auth user — requires service role in production; works via RLS in demo
      await supabase.auth.admin?.deleteUser?.(user.id);
      await logout();
      toast.success('Account deleted.');
    } catch (err) {
      // Even if admin delete fails, the profile is gone — log out
      await logout();
    } finally {
      setDeleting(false);
    }
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
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => !avatarUploading && fileInputRef.current?.click()}>
          <img
            src={user.avatar}
            alt={user.name}
            style={{ width: 100, height: 100, borderRadius: '50%', background: '#1a1a27', border: '3px solid rgba(99,102,241,0.4)', display: 'block', opacity: avatarUploading ? 0.5 : 1 }}
          />
          {/* Camera overlay */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </div>
          {avatarUploading && <div className="spinner" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} style={{ display: 'none' }} />
          <div style={{ position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, background: '#4ade80', borderRadius: '50%', border: '2px solid #0a0a0f' }} />
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
              {user.location || 'Worldwide'}
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
              Edit Profile
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
                placeholder="Search skills..."
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
                  Teaching ({offeredSkills.length})
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
                  Learning ({wantedSkills.length})
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
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f0f0ff', marginBottom: 4 }}>No reviews yet</div>
              <div style={{ fontSize: '0.8rem' }}>Complete sessions to earn reviews</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map(r => (
                <ProfileReviewItem key={r.id} review={r} reviewer={reviewers[r.reviewerId]} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1.5rem', border: '1px solid rgba(239,68,68,0.15)' }}>
        <h2 style={{ fontFamily: 'var(--font-outfit,Outfit),sans-serif', fontWeight: 700, fontSize: '1rem', color: '#f87171', marginBottom: '0.5rem' }}>Danger Zone</h2>
        <p style={{ color: '#a0a0c0', fontSize: '0.85rem', marginBottom: '1rem' }}>Permanently delete your account and all associated data. This cannot be undone.</p>
        <button onClick={() => setShowDeleteModal(true)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', padding: '0.6rem 1.25rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>Delete Account</button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#111118', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '1.25rem', padding: '2rem', width: '100%', maxWidth: 420 }}>
            <h2 style={{ fontFamily: 'var(--font-outfit,Outfit),sans-serif', fontWeight: 800, fontSize: '1.3rem', marginBottom: '0.75rem', color: '#f87171' }}>Delete your account?</h2>
            <p style={{ color: '#a0a0c0', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              This will permanently delete your profile, matches, messages, and sessions. <strong style={{ color: '#f0f0ff' }}>This action cannot be undone.</strong>
            </p>
            <p style={{ fontSize: '0.82rem', color: '#a0a0c0', marginBottom: '0.5rem' }}>Type <strong style={{ color: '#f0f0ff' }}>delete my account</strong> to confirm:</p>
            <input
              className="input-field"
              placeholder="delete my account"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              style={{ marginBottom: '1.25rem' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={deleteAccount}
                disabled={deleteConfirm !== 'delete my account' || deleting}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', background: deleteConfirm === 'delete my account' ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontWeight: 700, cursor: deleteConfirm === 'delete my account' ? 'pointer' : 'not-allowed', fontSize: '0.875rem', opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? 'Deleting…' : 'Delete Account'}
              </button>
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }} className="btn-secondary" style={{ fontSize: '0.875rem' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileReviewItem({ review, reviewer }) {
  return (
    <div style={{ padding: '1rem', background: 'rgba(17,17,24,0.6)', borderRadius: '0.875rem', border: '1px solid rgba(99,102,241,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem' }}>
        {reviewer && <img src={reviewer.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a1a27' }} />}
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{reviewer?.name || '…'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <StarRating value={review.rating} readonly size="sm" />
            {review.skillTaught && <span style={{ fontSize: '0.72rem', color: '#818cf8' }}>{review.skillTaught}</span>}
          </div>
        </div>
      </div>
      {review.comment && <p style={{ color: '#a0a0c0', fontSize: '0.82rem', lineHeight: 1.5, fontStyle: 'italic' }}>"{review.comment}"</p>}
    </div>
  );
}
