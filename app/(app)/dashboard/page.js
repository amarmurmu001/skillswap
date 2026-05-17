'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getMatchesForUser, getSessionsForUser, getReviewsForUser,
  getNotificationsForUser, getUserById, getSkillsByIds,
} from '@/lib/data';
import { getMatchSuggestions } from '@/lib/matching';
import SkillTag from '@/components/SkillTag';
import StarRating from '@/components/StarRating';
import Link from 'next/link';
import { formatDateTime, timeAgo } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [matches, sessions, reviews, notifications, suggestions, offeredSkills, wantedSkills] = await Promise.all([
        getMatchesForUser(user.id),
        getSessionsForUser(user.id),
        getReviewsForUser(user.id),
        getNotificationsForUser(user.id),
        getMatchSuggestions(user),
        getSkillsByIds(user.skillsOffered || []),
        getSkillsByIds(user.skillsWanted  || []),
      ]);
      setData({ matches, sessions: sessions.filter(s => s.status === 'upcoming'), reviews, notifications: notifications.filter(n => !n.isRead).slice(0, 4), suggestions: suggestions.slice(0, 3), offeredSkills, wantedSkills });
    }
    load();
  }, [user]);

  if (!user || !data) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  const { matches, sessions, reviews, notifications, suggestions, offeredSkills, wantedSkills } = data;
  const activeMatches  = matches.filter(m => m.status === 'active').length;
  const pendingMatches = matches.filter(m => m.status === 'pending').length;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem,4vw,2rem)', marginBottom: '0.25rem' }}>Welcome back, {user.name?.split(' ')[0]} 👋</h1>
          <p style={{ color: '#a0a0c0', fontSize: '0.9rem' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link href="/matches" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.875rem' }}><span>✨ Find Matches</span></Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: '✨', label: 'Active Swaps', value: activeMatches,    color: '#6366f1' },
          { icon: '⏳', label: 'Pending',      value: pendingMatches,   color: '#f59e0b' },
          { icon: '📅', label: 'Upcoming',     value: sessions.length,  color: '#10b981' },
          { icon: '⭐', label: 'Avg Rating',   value: user.rating || '–', color: '#f59e0b' },
        ].map(stat => (
          <div key={stat.label} className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>{stat.icon}</div>
            <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: '1.75rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ color: '#a0a0c0', fontSize: '0.78rem', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* My Skills */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '1rem' }}>My Skills</h2>
            <Link href="/profile" style={{ fontSize: '0.78rem', color: '#818cf8', textDecoration: 'none' }}>Edit →</Link>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Teaching ({offeredSkills.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {offeredSkills.length === 0 ? <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>None yet</span> : offeredSkills.map(s => <SkillTag key={s.id} skill={s} variant="offer" size="sm" />)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d946ef', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Learning ({wantedSkills.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {wantedSkills.length === 0 ? <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>None yet</span> : wantedSkills.map(s => <SkillTag key={s.id} skill={s} variant="want" size="sm" />)}
            </div>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '1rem' }}>Upcoming Sessions</h2>
            <Link href="/sessions" style={{ fontSize: '0.78rem', color: '#818cf8', textDecoration: 'none' }}>View all →</Link>
          </div>
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#a0a0c0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
              <div style={{ fontSize: '0.875rem' }}>No upcoming sessions</div>
            </div>
          ) : sessions.map(session => {
            const match   = matches.find(m => m.id === session.matchId);
            const otherId = match ? (match.userAId === user.id ? match.userBId : match.userAId) : null;
            return (
              <SessionPreview key={session.id} session={session} otherId={otherId} />
            );
          })}
        </div>

        {/* Top Suggestions */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '1rem' }}>Top Suggestions</h2>
            <Link href="/matches" style={{ fontSize: '0.78rem', color: '#818cf8', textDecoration: 'none' }}>See all →</Link>
          </div>
          {suggestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#a0a0c0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✨</div>
              <div style={{ fontSize: '0.875rem' }}>No matches yet</div>
            </div>
          ) : suggestions.map(({ user: other, score, isPerfect }) => (
            <div key={other.id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem', background: 'rgba(17,17,24,0.6)', borderRadius: '0.875rem', border: '1px solid rgba(99,102,241,0.12)', marginBottom: '0.75rem' }}>
              <img src={other.avatar} alt={other.name} style={{ width: 44, height: 44, borderRadius: '50%', background: '#1a1a27', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {other.name}
                  {isPerfect && <span style={{ fontSize: '0.65rem', color: '#818cf8', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 9999, padding: '0 6px' }}>Perfect</span>}
                </div>
                <div style={{ color: '#a0a0c0', fontSize: '0.78rem' }}>{other.location}</div>
              </div>
              <Link href="/matches" style={{ fontSize: '0.78rem', color: '#818cf8', textDecoration: 'none', flexShrink: 0 }}>View →</Link>
            </div>
          ))}
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>
              Recent Alerts <span style={{ marginLeft: 8, background: '#d946ef', color: '#fff', borderRadius: 9999, padding: '0 8px', fontSize: '0.72rem', fontWeight: 700 }}>{notifications.length}</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {notifications.map(n => (
                <Link key={n.id} href={n.link || '/'} style={{ textDecoration: 'none', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.75rem', background: 'rgba(99,102,241,0.05)', borderRadius: '0.875rem', border: '1px solid rgba(99,102,241,0.1)' }}>
                  <span style={{ fontSize: '1.25rem' }}>{n.type === 'match_request' ? '✨' : n.type === 'message' ? '💬' : '📅'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#f0f0ff' }}>{n.title}</div>
                    <div style={{ color: '#a0a0c0', fontSize: '0.78rem', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
                    <div style={{ color: '#6366f1', fontSize: '0.7rem', marginTop: 2 }}>{timeAgo(n.createdAt)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-component to load other user lazily
function SessionPreview({ session, otherId }) {
  const [other, setOther] = useState(null);
  useEffect(() => { if (otherId) getUserById(otherId).then(setOther); }, [otherId]);
  return (
    <div style={{ padding: '1rem', background: 'rgba(17,17,24,0.6)', borderRadius: '0.875rem', border: '1px solid rgba(99,102,241,0.12)', marginBottom: '0.875rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.topic}</div>
          {other && <div style={{ color: '#a0a0c0', fontSize: '0.78rem' }}>with {other.name}</div>}
          <div style={{ color: '#6366f1', fontSize: '0.78rem', marginTop: 4 }}>📅 {formatDateTime(session.scheduledAt)}</div>
        </div>
        <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.875rem', textDecoration: 'none', flexShrink: 0 }}><span>🎥 Join</span></a>
      </div>
    </div>
  );
}
