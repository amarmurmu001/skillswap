'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getUsers, getMatchesForUser, getSessionsForUser,
  getReviews, updateUser, updateMatchStatus,
} from '@/lib/data';
import StarRating from '@/components/StarRating';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab]     = useState('users');
  const [refresh, setRefresh] = useState(0);

  if (!user) return null;

  const allUsers   = getUsers();
  const allMatches = allUsers.flatMap(u => getMatchesForUser(u.id).filter(m => m.userAId === u.id));
  const allReviews = getReviews();

  const stats = [
    { label: 'Total Users',    value: allUsers.length,   icon: '👥', color: '#6366f1' },
    { label: 'Active Matches', value: allMatches.filter(m => m.status === 'active').length, icon: '✨', color: '#10b981' },
    { label: 'Pending',        value: allMatches.filter(m => m.status === 'pending').length, icon: '⏳', color: '#f59e0b' },
    { label: 'Reviews',        value: allReviews.length, icon: '⭐', color: '#d946ef' },
  ];

  function toggleBan(userId) {
    const u = allUsers.find(x => x.id === userId);
    if (!u) return;
    updateUser(userId, { banned: !u.banned });
    toast.success(u.banned ? 'User unbanned ✅' : 'User banned 🚫');
    setRefresh(r => r + 1);
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem,4vw,2rem)', marginBottom: '0.5rem' }}>
          🛡️ Admin Dashboard
        </h1>
        <p style={{ color: '#a0a0c0', fontSize: '0.9rem' }}>Monitor the SkillSwap community</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>{s.icon}</div>
            <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ color: '#a0a0c0', fontSize: '0.78rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['users', 'matches', 'reviews'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.875rem',
              background: tab === t ? 'rgba(99,102,241,0.15)' : 'transparent',
              border: `1px solid ${tab === t ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.12)'}`,
              color: tab === t ? '#818cf8' : '#a0a0c0',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.2s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Users table */}
      {tab === 'users' && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
                  {['User', 'Email', 'Location', 'Rating', 'Skills', 'Joined', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#a0a0c0', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(99,102,241,0.07)', opacity: u.banned ? 0.5 : 1 }}>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <img src={u.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a1a27' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem', color: '#a0a0c0' }}>{u.email}</td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem', color: '#a0a0c0', whiteSpace: 'nowrap' }}>{u.location || '—'}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#fbbf24', fontSize: '0.875rem' }}>★</span>
                        <span style={{ fontSize: '0.82rem' }}>{u.rating?.toFixed(1) || '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem', color: '#a0a0c0' }}>
                      <span style={{ color: '#6366f1' }}>{u.skillsOffered?.length}</span> / <span style={{ color: '#d946ef' }}>{u.skillsWanted?.length}</span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.78rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{formatDate(u.joinedAt)}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span className={`status-badge ${u.banned ? 'status-rejected' : 'status-active'}`}>
                        {u.banned ? '🚫 Banned' : '✓ Active'}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      {u.id !== user.id && (
                        <button
                          onClick={() => toggleBan(u.id)}
                          style={{
                            padding: '0.3rem 0.75rem',
                            borderRadius: '0.5rem',
                            background: u.banned ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                            border: `1px solid ${u.banned ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                            color: u.banned ? '#4ade80' : '#f87171',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {u.banned ? 'Unban' : 'Ban'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Matches table */}
      {tab === 'matches' && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
                  {['ID', 'User A', 'User B', 'Status', 'Score', 'Perfect', 'Created', 'Action'].map(h => (
                    <th key={h} style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#a0a0c0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allMatches.map(m => {
                  const userA = allUsers.find(u => u.id === m.userAId);
                  const userB = allUsers.find(u => u.id === m.userBId);
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid rgba(99,102,241,0.07)' }}>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.72rem', color: '#6b7280', fontFamily: 'monospace' }}>{m.id.slice(0, 8)}</td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem' }}>{userA?.name || m.userAId}</td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem' }}>{userB?.name || m.userBId}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span className={`status-badge status-${m.status}`}>{m.status}</span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem' }}>{m.score}</td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem' }}>{m.isPerfect ? '⚡ Yes' : 'No'}</td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.78rem', color: '#6b7280' }}>{formatDate(m.createdAt)}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {m.status !== 'rejected' && (
                          <button
                            onClick={() => { updateMatchStatus(m.id, 'rejected'); toast('Match removed'); setRefresh(r => r + 1); }}
                            style={{ padding: '0.3rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reviews */}
      {tab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {allReviews.map(r => {
            const reviewer = allUsers.find(u => u.id === r.reviewerId);
            const reviewee = allUsers.find(u => u.id === r.revieweeId);
            return (
              <div key={r.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <img src={reviewer?.avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a1a27' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{reviewer?.name}</span>
                    <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>→</span>
                    <img src={reviewee?.avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a1a27' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{reviewee?.name}</span>
                    <StarRating value={r.rating} readonly size="sm" />
                  </div>
                  {r.comment && <p style={{ color: '#a0a0c0', fontSize: '0.82rem', lineHeight: 1.5 }}>"{r.comment}"</p>}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{formatDate(r.createdAt)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
