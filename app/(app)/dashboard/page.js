'use client';

import { useAuth } from '@/context/AuthContext';
import {
  getMatchesForUser, getSessionsForUser, getReviewsForUser,
  getNotificationsForUser, getUserById, getSkillsByIds,
} from '@/lib/data';
import { getMatchSuggestions } from '@/lib/matching';
import SkillTag from '@/components/SkillTag';
import StarRating from '@/components/StarRating';
import Link from 'next/link';
import { formatDate, formatDateTime, timeAgo } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  const matches       = getMatchesForUser(user.id);
  const sessions      = getSessionsForUser(user.id).filter(s => s.status === 'upcoming');
  const reviews       = getReviewsForUser(user.id);
  const notifications = getNotificationsForUser(user.id).filter(n => !n.isRead).slice(0, 4);
  const suggestions   = getMatchSuggestions(user).slice(0, 3);

  const activeMatches  = matches.filter(m => m.status === 'active').length;
  const pendingMatches = matches.filter(m => m.status === 'pending').length;
  const offeredSkills  = getSkillsByIds(user.skillsOffered);
  const wantedSkills   = getSkillsByIds(user.skillsWanted);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Welcome header */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem,4vw,2rem)', marginBottom: '0.25rem' }}>
            Welcome back, {user.name.split(' ')[0]} 👋
          </h1>
          <p style={{ color: '#a0a0c0', fontSize: '0.9rem' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href="/matches" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.875rem' }}>
          <span>✨ Find Matches</span>
        </Link>
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
        {/* My skills */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '1rem' }}>My Skills</h2>
            <Link href="/profile" style={{ fontSize: '0.78rem', color: '#818cf8', textDecoration: 'none' }}>Edit →</Link>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              Teaching ({offeredSkills.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {offeredSkills.length === 0
                ? <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>None yet — <Link href="/profile" style={{ color: '#818cf8' }}>add skills</Link></span>
                : offeredSkills.map(s => <SkillTag key={s.id} skill={s} variant="offer" size="sm" />)
              }
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d946ef', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              Learning ({wantedSkills.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {wantedSkills.length === 0
                ? <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>None yet — <Link href="/profile" style={{ color: '#818cf8' }}>add skills</Link></span>
                : wantedSkills.map(s => <SkillTag key={s.id} skill={s} variant="want" size="sm" />)
              }
            </div>
          </div>
        </div>

        {/* Upcoming sessions */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '1rem' }}>Upcoming Sessions</h2>
            <Link href="/sessions" style={{ fontSize: '0.78rem', color: '#818cf8', textDecoration: 'none' }}>View all →</Link>
          </div>
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#a0a0c0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
              <div style={{ fontSize: '0.875rem' }}>No upcoming sessions</div>
              <Link href="/matches" style={{ color: '#818cf8', fontSize: '0.8rem', textDecoration: 'none' }}>Find matches to schedule →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {sessions.map(session => {
                const match = getMatchesForUser(user.id).find(m => m.id === session.matchId);
                const otherId = match ? (match.userAId === user.id ? match.userBId : match.userAId) : null;
                const other = otherId ? getUserById(otherId) : null;
                return (
                  <div key={session.id} style={{ padding: '1rem', background: 'rgba(17,17,24,0.6)', borderRadius: '0.875rem', border: '1px solid rgba(99,102,241,0.12)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {session.topic}
                        </div>
                        {other && <div style={{ color: '#a0a0c0', fontSize: '0.78rem' }}>with {other.name}</div>}
                        <div style={{ color: '#6366f1', fontSize: '0.78rem', marginTop: 4 }}>
                          📅 {formatDateTime(session.scheduledAt)}
                        </div>
                      </div>
                      <a
                        href={session.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary"
                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.875rem', textDecoration: 'none', flexShrink: 0 }}
                      >
                        <span>🎥 Join</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Match suggestions */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '1rem' }}>Top Suggestions</h2>
            <Link href="/matches" style={{ fontSize: '0.78rem', color: '#818cf8', textDecoration: 'none' }}>See all →</Link>
          </div>
          {suggestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#a0a0c0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✨</div>
              <div style={{ fontSize: '0.875rem' }}>No matches yet</div>
              <Link href="/profile" style={{ color: '#818cf8', fontSize: '0.8rem', textDecoration: 'none' }}>Add more skills to get matches →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {suggestions.map(({ user: other, score, isPerfect }) => (
                <div key={other.id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem', background: 'rgba(17,17,24,0.6)', borderRadius: '0.875rem', border: '1px solid rgba(99,102,241,0.12)' }}>
                  <img src={other.avatar} alt={other.name} style={{ width: 44, height: 44, borderRadius: '50%', background: '#1a1a27', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {other.name}
                      {isPerfect && <span style={{ fontSize: '0.65rem', color: '#818cf8', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 9999, padding: '0 6px' }}>Perfect</span>}
                    </div>
                    <div style={{ color: '#a0a0c0', fontSize: '0.78rem' }}>{other.location}</div>
                  </div>
                  <Link href="/matches" style={{ fontSize: '0.78rem', color: '#818cf8', textDecoration: 'none', flexShrink: 0 }}>
                    View →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '1rem' }}>
                Recent Alerts
                <span style={{ marginLeft: 8, background: '#d946ef', color: '#fff', borderRadius: 9999, padding: '0 8px', fontSize: '0.72rem', fontWeight: 700 }}>{notifications.length}</span>
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {notifications.map(n => (
                <Link key={n.id} href={n.link || '/'} style={{ textDecoration: 'none', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.75rem', background: 'rgba(99,102,241,0.05)', borderRadius: '0.875rem', border: '1px solid rgba(99,102,241,0.1)' }}>
                  <span style={{ fontSize: '1.25rem' }}>
                    {n.type === 'match_request' ? '✨' : n.type === 'message' ? '💬' : '📅'}
                  </span>
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

        {/* Recent reviews */}
        {reviews.length > 0 && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>
              Recent Reviews
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.slice(0, 3).map(r => {
                const reviewer = getUserById(r.reviewerId);
                return (
                  <div key={r.id} style={{ padding: '1rem', background: 'rgba(17,17,24,0.6)', borderRadius: '0.875rem', border: '1px solid rgba(99,102,241,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                      {reviewer && <img src={reviewer.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a1a27' }} />}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{reviewer?.name}</div>
                        <StarRating value={r.rating} readonly size="sm" />
                      </div>
                    </div>
                    {r.comment && <p style={{ color: '#a0a0c0', fontSize: '0.82rem', lineHeight: 1.5 }}>"{r.comment}"</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
