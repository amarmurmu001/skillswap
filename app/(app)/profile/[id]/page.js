'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  getUserById, getSkillsByIds, getReviewsForUser,
  getMatchesForUser, createMatchRequest, addNotification,
} from '@/lib/data';
import { scorePair } from '@/lib/matching';
import SkillTag from '@/components/SkillTag';
import StarRating from '@/components/StarRating';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function UserProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();

  const profile = getUserById(id);
  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#a0a0c0' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
        <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, marginBottom: '0.5rem' }}>User not found</h2>
        <Link href="/browse" style={{ color: '#818cf8', textDecoration: 'none' }}>← Back to Browse</Link>
      </div>
    );
  }

  const reviews       = getReviewsForUser(profile.id);
  const offeredSkills = getSkillsByIds(profile.skillsOffered);
  const wantedSkills  = getSkillsByIds(profile.skillsWanted);

  const { score, isPerfect, iCanTeachThem, theyCanTeachMe } = currentUser
    ? scorePair(currentUser, profile)
    : { score: 0, isPerfect: false, iCanTeachThem: [], theyCanTeachMe: [] };

  const existingMatches = currentUser ? getMatchesForUser(currentUser.id) : [];
  const existingMatch   = existingMatches.find(
    m => m.userAId === profile.id || m.userBId === profile.id
  );

  function handleConnect() {
    if (!currentUser || existingMatch) return;
    createMatchRequest(currentUser.id, profile.id, score, isPerfect);
    addNotification({
      userId: profile.id,
      type: 'match_request',
      title: 'New Match Request',
      message: `${currentUser.name} wants to swap skills with you!`,
      link: '/matches',
    });
    toast.success('Match request sent! ✨');
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <Link href="/browse" style={{ color: '#818cf8', textDecoration: 'none', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1.5rem' }}>
        ← Back to Browse
      </Link>

      {/* Profile card */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <img
              src={profile.avatar}
              alt={profile.name}
              style={{ width: 96, height: 96, borderRadius: '50%', background: '#1a1a27', border: '3px solid rgba(99,102,241,0.4)' }}
            />
            {profile.isOnline && (
              <div style={{ position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, background: '#4ade80', borderRadius: '50%', border: '2px solid #0a0a0f' }} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
              <h1 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.5rem' }}>{profile.name}</h1>
              {isPerfect && (
                <span style={{ fontSize: '0.72rem', color: '#818cf8', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 9999, padding: '0.2rem 0.625rem', fontWeight: 700 }}>
                  ⚡ Perfect Match
                </span>
              )}
            </div>
            <div style={{ color: '#a0a0c0', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              {profile.location ? `📍 ${profile.location}` : '🌍 Worldwide'} · Joined {formatDate(profile.joinedAt)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
              <StarRating value={Math.round(profile.rating)} readonly size="sm" />
              <span style={{ fontSize: '0.82rem', color: '#a0a0c0' }}>{profile.rating.toFixed(1)} ({profile.totalReviews} reviews)</span>
            </div>
            {profile.bio && <p style={{ color: '#a0a0c0', fontSize: '0.875rem', lineHeight: 1.6 }}>{profile.bio}</p>}
          </div>

          {currentUser && currentUser.id !== profile.id && (
            <div>
              {existingMatch ? (
                <div>
                  <span className={`status-badge status-${existingMatch.status}`}>
                    {existingMatch.status === 'active' ? '✨ Connected' : existingMatch.status === 'pending' ? '⏳ Pending' : existingMatch.status}
                  </span>
                  {existingMatch.status === 'active' && (
                    <Link href="/chat" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.875rem', display: 'block', marginTop: '0.5rem', textAlign: 'center' }}>
                      <span>💬 Chat</span>
                    </Link>
                  )}
                </div>
              ) : (
                <button onClick={handleConnect} className="btn-primary" style={{ fontSize: '0.875rem' }}>
                  <span>✨ Connect</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Skills */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>Skills</h2>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>
              🎓 Teaches ({offeredSkills.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {offeredSkills.map(s => {
                const iMatch = iCanTeachThem.length === 0 && theyCanTeachMe.includes(s.id);
                return <SkillTag key={s.id} skill={s} variant={iMatch ? 'want' : 'offer'} />;
              })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d946ef', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>
              🌱 Learning ({wantedSkills.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {wantedSkills.map(s => <SkillTag key={s.id} skill={s} variant="want" />)}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>
            Reviews ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#a0a0c0', fontSize: '0.875rem' }}>
              No reviews yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map(r => {
                const reviewer = getUserById(r.reviewerId);
                return (
                  <div key={r.id} style={{ padding: '1rem', background: 'rgba(17,17,24,0.6)', borderRadius: '0.875rem', border: '1px solid rgba(99,102,241,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                      {reviewer && <img src={reviewer.avatar} alt="" style={{ width: 30, height: 30, borderRadius: '50%', background: '#1a1a27' }} />}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{reviewer?.name}</div>
                        <StarRating value={r.rating} readonly size="sm" />
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
