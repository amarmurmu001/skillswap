'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMatchesForUser, getUsersByIds, addReview } from '@/lib/data';
import { getSessionsForUser, createSession, updateSession } from '@/lib/services/session.service';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SessionsPage() {
  const { user } = useAuth();
  const [tab, setTab]           = useState('upcoming');
  const [showForm, setShowForm] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [matches, setMatches]   = useState([]);
  const [usersById, setUsersById] = useState({});
  const [loading, setLoading]   = useState(true);
  const [form, setForm] = useState({ matchId: '', topic: '', scheduledAt: '', duration: 60 });
  const [reviewPrompt, setReviewPrompt] = useState(null); // { sessionId, matchId, otherUser }
  const [reviewForm, setReviewForm]     = useState({ rating: 5, comment: '' });
  const [reviewSaving, setReviewSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [s, m] = await Promise.all([getSessionsForUser(user.id), getMatchesForUser(user.id)]);
    const active = m.filter(x => x.status === 'active');
    const otherIds = [
      ...new Set(
        s.map(sess => {
          const match = m.find(x => x.id === sess.matchId);
          return match ? (match.userAId === user.id ? match.userBId : match.userAId) : null;
        }).filter(Boolean)
      ),
    ];
    const users = otherIds.length ? await getUsersByIds(otherIds) : {};
    setSessions(s);
    setMatches(m);
    setUsersById(users);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.matchId) { toast.error('Please select a match'); return; }
    let isoDate;
    try {
      isoDate = new Date(form.scheduledAt).toISOString();
    } catch {
      toast.error('Invalid date and time selected');
      return;
    }
    await createSession({ ...form, scheduledAt: isoDate, hostId: user.id });
    toast.success('Session scheduled!');
    setShowForm(false);
    setForm({ matchId: '', topic: '', scheduledAt: '', duration: 60 });
    load();
  }

  async function handleComplete(sessionId) {
    await updateSession(sessionId, { status: 'completed' });
    toast.success('Session marked as completed.');
    load();
    // Find the completed session to get match + other user for review prompt
    const sess = sessions.find(s => s.id === sessionId);
    if (sess) {
      const match = matches.find(m => m.id === sess.matchId);
      const otherId = match ? (match.userAId === user.id ? match.userBId : match.userAId) : null;
      const otherUser = otherId ? usersById[otherId] : null;
      setReviewForm({ rating: 5, comment: '' });
      setReviewPrompt({ sessionId, matchId: sess.matchId, otherUser });
    }
  }

  async function submitReview() {
    if (!reviewPrompt) return;
    setReviewSaving(true);
    try {
      await addReview({
        reviewerId: user.id,
        revieweeId: reviewPrompt.otherUser?.id,
        matchId:    reviewPrompt.matchId,
        rating:     reviewForm.rating,
        comment:    reviewForm.comment,
      });
      toast.success('Review submitted. Thank you!');
      setReviewPrompt(null);
    } catch {
      toast.error('Failed to submit review');
    } finally {
      setReviewSaving(false);
    }
  }

  const byStatus = (status) => sessions.filter(s => s.status === status).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const TABS = [
    { key: 'upcoming',  label: 'Upcoming',  count: byStatus('upcoming').length },
    { key: 'completed', label: 'Completed', count: byStatus('completed').length },
  ];

  if (!user) return null;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem,4vw,2rem)', marginBottom: '0.5rem' }}>Sessions</h1>
          <p style={{ color: '#a0a0c0', fontSize: '0.9rem' }}>Schedule and manage your skill exchange sessions</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary" style={{ fontSize: '0.875rem' }}>
          <span>{showForm ? 'Cancel' : '+ Schedule Session'}</span>
        </button>
      </div>

      {showForm && (
        <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem' }}>New Session</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '0.4rem' }}>With (Match)</label>
              <select className="input-field" value={form.matchId} onChange={e => setForm(p => ({ ...p, matchId: e.target.value }))} required style={{ cursor: 'pointer' }}>
                <option value="">Select match...</option>
                {matches.filter(m => m.status === 'active').map(m => <MatchOption key={m.id} match={m} userId={user.id} usersById={usersById} />)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '0.4rem' }}>Topic</label>
              <input type="text" className="input-field" placeholder="e.g. React Hooks Intro" value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '0.4rem' }}>Date & Time</label>
              <input type="datetime-local" className="input-field" value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))} required style={{ colorScheme: 'dark' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '0.4rem' }}>Duration</label>
              <select className="input-field" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: Number(e.target.value) }))} style={{ cursor: 'pointer' }}>
                {[30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button type="submit" className="btn-primary" style={{ fontSize: '0.875rem' }}><span>Schedule</span></button>
              <span style={{ fontSize: '0.8rem', color: '#a0a0c0' }}>A Jitsi Meet link will be auto-generated</span>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '0.5rem 1.25rem', borderRadius: '0.875rem', background: tab === t.key ? 'rgba(99,102,241,0.15)' : 'transparent', border: `1px solid ${tab === t.key ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.12)'}`, color: tab === t.key ? '#818cf8' : '#a0a0c0', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s, color 0.2s', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {t.label}
            {t.count > 0 && <span style={{ background: tab === t.key ? '#6366f1' : 'rgba(99,102,241,0.2)', color: tab === t.key ? '#fff' : '#818cf8', borderRadius: 9999, padding: '0 7px', fontSize: '0.7rem', fontWeight: 700 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {byStatus(tab).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#a0a0c0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-outfit,Outfit),sans-serif', fontWeight: 700, marginBottom: '0.5rem' }}>No {tab} sessions</h3>
              {tab === 'upcoming' && <button onClick={() => setShowForm(true)} className="btn-primary" style={{ marginTop: '1rem', fontSize: '0.875rem' }}><span>+ Schedule a Session</span></button>}
            </div>
          ) : byStatus(tab).map(session => (
            <SessionRow key={session.id} session={session} userId={user.id} matches={matches} usersById={usersById} tab={tab} onComplete={handleComplete} />
          ))}
        </div>
      )}

      {/* ── Review prompt modal ─────────────────────────────────────── */}
      {reviewPrompt && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#111118', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '1.5rem', padding: '2rem', width: '100%', maxWidth: 440, boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
            <h2 style={{ fontFamily: 'var(--font-outfit,Outfit),sans-serif', fontWeight: 800, fontSize: '1.3rem', marginBottom: '0.5rem' }}>
              How was your session?
            </h2>
            <p style={{ color: '#a0a0c0', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Leave a review for{' '}
              <strong style={{ color: '#f0f0ff' }}>{reviewPrompt.otherUser?.name || 'your partner'}</strong>
              {' '}to help others in the community.
            </p>

            {/* Star picker */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', justifyContent: 'center' }}>
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', transition: 'transform 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill={n <= reviewForm.rating ? '#f59e0b' : 'none'} stroke={n <= reviewForm.rating ? '#f59e0b' : '#4b5563'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </button>
              ))}
            </div>

            <textarea
              className="input-field"
              placeholder="Write a comment (optional)…"
              rows={3}
              value={reviewForm.comment}
              onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
              style={{ resize: 'none', marginBottom: '1.25rem', fontFamily: 'var(--font-inter,Inter),sans-serif' }}
            />

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={submitReview}
                disabled={reviewSaving}
                className="btn-primary"
                style={{ flex: 1, opacity: reviewSaving ? 0.7 : 1, fontSize: '0.9rem' }}
              >
                <span>{reviewSaving ? 'Submitting…' : 'Submit Review'}</span>
              </button>
              <button
                onClick={() => setReviewPrompt(null)}
                className="btn-secondary"
                style={{ fontSize: '0.9rem' }}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MatchOption({ match, userId, usersById }) {
  const otherId = match.userAId === userId ? match.userBId : match.userAId;
  const name = usersById[otherId]?.name || 'Partner';
  return <option value={match.id}>{name}</option>;
}

function SessionRow({ session, userId, matches, usersById, tab, onComplete }) {
  const match = matches.find(m => m.id === session.matchId);
  const otherId = match ? (match.userAId === userId ? match.userBId : match.userAId) : null;
  const other = otherId ? usersById[otherId] : null;

  const isPast = new Date(session.scheduledAt) < new Date();

  return (
    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ width: 56, height: 56, flexShrink: 0, background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(217,70,239,0.15))', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {tab === 'upcoming'
          ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{session.topic}</div>
        {other && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
            <img src={other.avatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%', background: '#1a1a27' }} />
            <span style={{ color: '#a0a0c0', fontSize: '0.82rem' }}>with {other.name}</span>
          </div>
        )}
        <div style={{ color: '#6366f1', fontSize: '0.82rem' }}>📅 {formatDateTime(session.scheduledAt)} · {session.duration} min</div>
      </div>
      <div style={{ display: 'flex', gap: '0.625rem', flexShrink: 0 }}>
        {tab === 'upcoming' && (
          <>
            <Link href={`/meeting/${session.id}`} className="btn-primary" style={{ fontSize: '0.82rem', padding: '0.5rem 1rem', textDecoration: 'none' }}><span>Join Call</span></Link>
            {isPast && <button onClick={() => onComplete(session.id)} className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.5rem 0.875rem' }}>Mark Done</button>}
          </>
        )}
        {tab === 'completed' && <span className="status-badge status-completed">Completed</span>}
      </div>
    </div>
  );
}
