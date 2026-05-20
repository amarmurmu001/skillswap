'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SkillTag from './SkillTag';
import StarRating from './StarRating';
import { useAppData } from '@/context/AppDataContext';
import { matchPercent } from '@/lib/matching';

export default function MatchCard({ match, currentUserId, onSendRequest, onAccept, onReject, existingMatchStatus, existingMatchSenderId }) {
  const router = useRouter();
  const { resolveSkills } = useAppData();
  const { user, score, isPerfect, iCanTeachThem, theyCanTeachMe } = match;

  const offeredSkills = resolveSkills(iCanTeachThem);
  const wantedSkills  = resolveSkills(theyCanTeachMe);
  const pct = matchPercent(score);

  const ringColor  = isPerfect ? '#6366f1' : '#d946ef';
  const ringColor2 = isPerfect ? '#d946ef' : '#f97316';

  return (
    <div className="glass-card group" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      {/* Perfect match shimmer */}
      {isPerfect && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(217,70,239,0.04) 100%)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={user.avatar}
            alt={user.name}
            style={{
              width: 64, height: 64,
              borderRadius: '50%',
              background: '#1a1a27',
              border: `2px solid ${isPerfect ? '#6366f1' : 'rgba(99,102,241,0.3)'}`,
            }}
          />
          {user.isOnline && (
            <div style={{
              position: 'absolute', bottom: 2, right: 2,
              width: 12, height: 12,
              background: '#4ade80',
              borderRadius: '50%',
              border: '2px solid #0a0a0f',
            }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'Outfit,sans-serif' }}>{user.name}</h3>
            {isPerfect && (
              <span style={{
                fontSize: '0.68rem', fontWeight: 700,
                background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(217,70,239,0.2))',
                color: '#a5b4fc',
                border: '1px solid rgba(99,102,241,0.3)',
                padding: '0.15rem 0.5rem',
                borderRadius: 9999,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>Perfect Match</span>
            )}
          </div>
          <div style={{ color: '#a0a0c0', fontSize: '0.8rem', marginTop: 2 }}>
            {user.location || 'Worldwide'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 4 }}>
            <StarRating value={Math.round(user.rating)} readonly size="sm" />
            <span style={{ fontSize: '0.78rem', color: '#a0a0c0' }}>
              {user.rating.toFixed(1)} ({user.totalReviews})
            </span>
          </div>
        </div>

        {/* Score ring */}
        <div className="score-ring" style={{ flexShrink: 0, width: 54, height: 54 }}>
          <svg width="54" height="54" viewBox="0 0 54 54">
            <circle cx="27" cy="27" r="22" fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="4" />
            <circle
              cx="27" cy="27" r="22"
              fill="none"
              stroke={`url(#grad-${user.id})`}
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 22 * pct / 100} ${2 * Math.PI * 22}`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id={`grad-${user.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={ringColor} />
                <stop offset="100%" stopColor={ringColor2} />
              </linearGradient>
            </defs>
          </svg>
          <div className="score-text" style={{ fontSize: '0.75rem', color: ringColor }}>
            {pct}%
          </div>
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <p style={{ color: '#a0a0c0', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '1rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {user.bio}
        </p>
      )}

      {/* Skills exchange */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {offeredSkills.length > 0 && (
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6366f1', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              I can teach
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {offeredSkills.map(s => <SkillTag key={s.id} skill={s} variant="offer" size="sm" />)}
            </div>
          </div>
        )}
        {wantedSkills.length > 0 && (
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#d946ef', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              They can teach me
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {wantedSkills.map(s => <SkillTag key={s.id} skill={s} variant="want" size="sm" />)}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {existingMatchStatus === 'active' ? (
          <button
            onClick={() => router.push('/chat')}
            className="btn-primary"
            style={{ flex: 1, fontSize: '0.875rem', padding: '0.625rem 1rem' }}
          >
            <span>Open Chat</span>
          </button>
        ) : existingMatchStatus === 'pending' ? (
          existingMatchSenderId === currentUserId ? (
            <button
              disabled
              className="btn-secondary"
              style={{ flex: 1, fontSize: '0.875rem', padding: '0.625rem 1rem', cursor: 'not-allowed', opacity: 0.7 }}
            >
              Pending
            </button>
          ) : (
            <>
              <button
                onClick={() => onAccept && onAccept()}
                className="btn-primary"
                style={{ flex: 1, fontSize: '0.875rem', padding: '0.625rem 1rem' }}
              >
                <span>✓ Accept</span>
              </button>
              <button
                onClick={() => onReject && onReject()}
                className="btn-secondary"
                style={{ flex: 1, fontSize: '0.875rem', padding: '0.625rem 1rem' }}
              >
                Decline
              </button>
            </>
          )
        ) : (
          <>
            <button
              onClick={() => onSendRequest && onSendRequest(user.id, score, isPerfect)}
              className="btn-primary"
              style={{ flex: 1, fontSize: '0.875rem', padding: '0.625rem 1rem' }}
            >
              <span>Send Request</span>
            </button>
            <Link
              href={`/profile/${user.id}`}
              className="btn-secondary"
              style={{ flex: 1, fontSize: '0.875rem', padding: '0.625rem 1rem', textAlign: 'center', textDecoration: 'none', display: 'block' }}
            >
              View Profile
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
