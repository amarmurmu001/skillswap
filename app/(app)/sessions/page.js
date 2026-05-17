'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getSessionsForUser, getMatchesForUser, getUserById,
  createSession, updateSession,
} from '@/lib/data';
import { formatDateTime, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SessionsPage() {
  const { user } = useAuth();
  const [tab, setTab]           = useState('upcoming');
  const [showForm, setShowForm] = useState(false);
  const [refresh, setRefresh]   = useState(0);
  const [form, setForm]         = useState({
    matchId: '', topic: '', scheduledAt: '', duration: 60,
  });

  if (!user) return null;

  const sessions = getSessionsForUser(user.id);
  const matches  = getMatchesForUser(user.id).filter(m => m.status === 'active');

  const byStatus = (status) => sessions
    .filter(s => s.status === status)
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  function handleCreate(e) {
    e.preventDefault();
    if (!form.matchId) { toast.error('Please select a match'); return; }
    createSession({ ...form, hostId: user.id });
    toast.success('Session scheduled! 📅');
    setShowForm(false);
    setForm({ matchId: '', topic: '', scheduledAt: '', duration: 60 });
    setRefresh(r => r + 1);
  }

  function handleComplete(sessionId) {
    updateSession(sessionId, { status: 'completed' });
    toast.success('Session marked as completed ✅');
    setRefresh(r => r + 1);
  }

  const TABS = [
    { key: 'upcoming',  label: '📅 Upcoming',  count: byStatus('upcoming').length },
    { key: 'completed', label: '✅ Completed', count: byStatus('completed').length },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem,4vw,2rem)', marginBottom: '0.5rem' }}>Sessions</h1>
          <p style={{ color: '#a0a0c0', fontSize: '0.9rem' }}>Schedule and manage your skill exchange sessions</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="btn-primary"
          style={{ fontSize: '0.875rem' }}
        >
          <span>{showForm ? '✕ Cancel' : '+ Schedule Session'}</span>
        </button>
      </div>

      {/* Schedule form */}
      {showForm && (
        <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem' }}>
            New Session
          </h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '0.4rem' }}>With (Match)</label>
              <select
                className="input-field"
                value={form.matchId}
                onChange={e => setForm(p => ({ ...p, matchId: e.target.value }))}
                required
                style={{ cursor: 'pointer' }}
              >
                <option value="">Select match...</option>
                {matches.map(m => {
                  const otherId = m.userAId === user.id ? m.userBId : m.userAId;
                  const other   = getUserById(otherId);
                  return <option key={m.id} value={m.id}>{other?.name || otherId}</option>;
                })}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '0.4rem' }}>Topic</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. React Hooks Intro"
                value={form.topic}
                onChange={e => setForm(p => ({ ...p, topic: e.target.value }))}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '0.4rem' }}>Date & Time</label>
              <input
                type="datetime-local"
                className="input-field"
                value={form.scheduledAt}
                onChange={e => setForm(p => ({ ...p, scheduledAt: new Date(e.target.value).toISOString() }))}
                required
                style={{ colorScheme: 'dark' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '0.4rem' }}>Duration (minutes)</label>
              <select
                className="input-field"
                value={form.duration}
                onChange={e => setForm(p => ({ ...p, duration: Number(e.target.value) }))}
                style={{ cursor: 'pointer' }}
              >
                {[30, 45, 60, 90, 120].map(d => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn-primary" style={{ fontSize: '0.875rem' }}>
                <span>📅 Schedule</span>
              </button>
              <div style={{ fontSize: '0.8rem', color: '#a0a0c0', alignSelf: 'center' }}>
                A Jitsi Meet link will be auto-generated ✨
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.875rem',
              background: tab === t.key ? 'rgba(99,102,241,0.15)' : 'transparent',
              border: `1px solid ${tab === t.key ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.12)'}`,
              color: tab === t.key ? '#818cf8' : '#a0a0c0',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex', gap: '0.5rem', alignItems: 'center',
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span style={{ background: tab === t.key ? '#6366f1' : 'rgba(99,102,241,0.2)', color: tab === t.key ? '#fff' : '#818cf8', borderRadius: 9999, padding: '0 7px', fontSize: '0.7rem', fontWeight: 700 }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Session list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {byStatus(tab).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#a0a0c0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
            <h3 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, marginBottom: '0.5rem' }}>
              No {tab} sessions
            </h3>
            {tab === 'upcoming' && (
              <button onClick={() => setShowForm(true)} className="btn-primary" style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                <span>+ Schedule a Session</span>
              </button>
            )}
          </div>
        ) : (
          byStatus(tab).map(session => {
            const match   = getMatchesForUser(user.id).find(m => m.id === session.matchId);
            const otherId = match ? (match.userAId === user.id ? match.userBId : match.userAId) : null;
            const other   = otherId ? getUserById(otherId) : null;
            const isPast  = new Date(session.scheduledAt) < new Date();

            return (
              <div key={session.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{
                  width: 56, height: 56, flexShrink: 0,
                  background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(217,70,239,0.15))',
                  border: '1px solid rgba(99,102,241,0.25)',
                  borderRadius: '1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem',
                }}>
                  {tab === 'upcoming' ? '📅' : '✅'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{session.topic}</div>
                  {other && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                      <img src={other.avatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%', background: '#1a1a27' }} />
                      <span style={{ color: '#a0a0c0', fontSize: '0.82rem' }}>with {other.name}</span>
                    </div>
                  )}
                  <div style={{ color: '#6366f1', fontSize: '0.82rem' }}>
                    📅 {formatDateTime(session.scheduledAt)} · {session.duration} min
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.625rem', flexShrink: 0 }}>
                  {tab === 'upcoming' && (
                    <>
                      <a
                        href={session.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary"
                        style={{ fontSize: '0.82rem', padding: '0.5rem 1rem', textDecoration: 'none' }}
                      >
                        <span>🎥 Join Call</span>
                      </a>
                      {isPast && (
                        <button
                          onClick={() => handleComplete(session.id)}
                          className="btn-secondary"
                          style={{ fontSize: '0.82rem', padding: '0.5rem 0.875rem' }}
                        >
                          ✓ Mark Done
                        </button>
                      )}
                    </>
                  )}
                  {tab === 'completed' && (
                    <span className="status-badge status-completed">Completed</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
