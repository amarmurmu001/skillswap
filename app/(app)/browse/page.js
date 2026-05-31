'use client';

import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createMatchRequest, addNotification, getMatchesForUser } from '@/lib/data';
import { getBrowseUsersFromList } from '@/lib/matching';
import { useAppData } from '@/context/AppDataContext';
import SkillTag from '@/components/SkillTag';
import StarRating from '@/components/StarRating';
import Link from 'next/link';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Tech', 'Music', 'Language', 'Art', 'Fitness', 'Lifestyle', 'Games', 'Professional'];

const PAGE_SIZE = 20;

export default function BrowsePage() {
  const { user } = useAuth();
  const { users, skills, skillsById, ready, resolveSkills } = useAppData();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [search, setSearch]    = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy]    = useState('match');
  const [page, setPage]        = useState(1);

  useEffect(() => {
    if (!user || !ready) return;
    async function loadMatches() {
      try {
        const m = await getMatchesForUser(user.id);
        setMatches(m);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, [user, ready]);

  // Pre-ranked list (score already computed)
  const allUsers = useMemo(
    () => (user && ready ? getBrowseUsersFromList(user, users) : []),
    [user, ready, users]
  );

  // Build a Set of skill IDs that belong to the selected category — used to
  // filter users without re-running resolveSkills on every card.
  const categorySkillIds = useMemo(() => {
    if (category === 'All') return null; // null = no filter
    const ids = new Set();
    for (const s of skills) {
      if (s.category === category) ids.add(s.id);
    }
    return ids;
  }, [category, skills]);

  const filtered = useMemo(() => {
    let list = allUsers.filter(({ user: u }) => {
      // Text search
      const q = search.toLowerCase();
      if (q && !u.name?.toLowerCase().includes(q) && !u.bio?.toLowerCase().includes(q) && !u.location?.toLowerCase().includes(q)) return false;

      // Category filter — keep user if they offer OR want at least one skill in the category
      if (categorySkillIds) {
        const hasCategory =
          (u.skillsOffered || []).some(id => categorySkillIds.has(id)) ||
          (u.skillsWanted  || []).some(id => categorySkillIds.has(id));
        if (!hasCategory) return false;
      }

      return true;
    });

    if (sortBy === 'rating') list = [...list].sort((a, b) => b.user.rating - a.user.rating);
    if (sortBy === 'name')   list = [...list].sort((a, b) => a.user.name.localeCompare(b.user.name));

    // Pre-resolve skills here (once per filter run) instead of inside each card render
    return list.map(item => ({
      ...item,
      offeredSkills: resolveSkills((item.user.skillsOffered || []).slice(0, 3)),
      wantedSkills:  resolveSkills((item.user.skillsWanted  || []).slice(0, 3)),
    }));
  }, [allUsers, search, sortBy, categorySkillIds, resolveSkills]);

  const handleConnect = useCallback(async (otherId, score, isPerfect) => {
    try {
      await createMatchRequest(user.id, otherId, score, isPerfect);
      await addNotification({ userId: otherId, type: 'match_request', title: 'New Match Request', message: `${user.name} wants to swap skills with you!`, link: '/matches' });
      toast.success('Connection request sent!');
      const m = await getMatchesForUser(user.id);
      setMatches(m);
    } catch (err) {
      toast.error(err.message || 'Failed to send request');
    }
  }, [user]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, category, sortBy]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  if (!user) return null;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem,4vw,2rem)', marginBottom: '0.5rem' }}>Browse Community</h1>
        <p style={{ color: '#a0a0c0', fontSize: '0.9rem' }}>Explore all members — even partial matches can start great exchanges.</p>
      </div>

      <div style={{ display: 'flex', gap: '0.875rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input type="text" name="browse-search" autoComplete="off" className="input-field" placeholder="Search by name, bio, location…" aria-label="Search community members" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: '1 1 220px', minWidth: 0 }} />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field" style={{ flex: '0 0 auto', width: 'auto', cursor: 'pointer' }}>
          <option value="match">Sort: Best Match</option>
          <option value="rating">Sort: Rating</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} style={{ padding: '0.4rem 1rem', borderRadius: 9999, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s, color 0.2s, border-color 0.2s', background: category === cat ? 'rgba(99,102,241,0.2)' : 'rgba(17,17,24,0.8)', color: category === cat ? '#818cf8' : '#a0a0c0', border: `1px solid ${category === cat ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}` }}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><div className="spinner" /></div>
      ) : (
        <>
          <p style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '1rem' }}>
            {filtered.length} member{filtered.length !== 1 ? 's' : ''} found
            {filtered.length > visible.length && ` — showing ${visible.length}`}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.25rem' }}>
            {visible.map(({ user: other, score, isPerfect, offeredSkills, wantedSkills }) => {
              const existing = matches.find(m => m.userAId === other.id || m.userBId === other.id);
              return (
                <BrowseCard
                  key={other.id}
                  other={other}
                  score={score}
                  isPerfect={isPerfect}
                  offeredSkills={offeredSkills}
                  wantedSkills={wantedSkills}
                  existingMatchStatus={existing?.status}
                  onConnect={() => handleConnect(other.id, score, isPerfect)}
                />
              );
            })}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem 2rem', color: '#a0a0c0' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <h3 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, marginBottom: '0.5rem' }}>No users found</h3>
              </div>
            )}
          </div>
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button
                onClick={() => setPage(p => p + 1)}
                className="btn-secondary"
                style={{ fontSize: '0.875rem', minWidth: 160 }}
              >
                Load More ({filtered.length - visible.length} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// memo prevents re-renders when parent re-renders but this card's props haven't changed.
// Skills are now passed in pre-resolved (no resolveSkills call inside the card).
const BrowseCard = memo(function BrowseCard({ other, isPerfect, offeredSkills, wantedSkills, onConnect, existingMatchStatus }) {
  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <img src={other.avatar} alt={other.name} style={{ width: 56, height: 56, borderRadius: '50%', background: '#1a1a27', border: isPerfect ? '2px solid #6366f1' : '2px solid rgba(99,102,241,0.2)' }} />
          {other.isOnline && <div style={{ position: 'absolute', bottom: 2, right: 2, width: 10, height: 10, background: '#4ade80', borderRadius: '50%', border: '2px solid #0a0a0f' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {other.name}
            {isPerfect && <span style={{ marginLeft: 6, fontSize: '0.65rem', color: '#818cf8', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 9999, padding: '0 5px' }}>Perfect</span>}
          </div>
          <div style={{ color: '#a0a0c0', fontSize: '0.78rem' }}>{other.location || 'Worldwide'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: 2 }}>
            <StarRating value={Math.round(other.rating || 0)} readonly size="sm" />
            <span style={{ fontSize: '0.72rem', color: '#a0a0c0' }}>{(other.rating || 0).toFixed(1)}</span>
          </div>
        </div>
      </div>
      {other.bio && <p style={{ color: '#a0a0c0', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '1rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{other.bio}</p>}
      {offeredSkills.length > 0 && (
        <div style={{ marginBottom: '0.625rem' }}>
          <div style={{ fontSize: '0.68rem', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>Teaches</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>{offeredSkills.map(s => <SkillTag key={s.id} skill={s} variant="offer" size="sm" />)}</div>
        </div>
      )}
      {wantedSkills.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.68rem', color: '#d946ef', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>Learning</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>{wantedSkills.map(s => <SkillTag key={s.id} skill={s} variant="want" size="sm" />)}</div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {existingMatchStatus === 'active' ? (
          <Link href="/chat" className="btn-primary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem 0.875rem', textAlign: 'center', textDecoration: 'none', display: 'block' }}>
            <span>Chat</span>
          </Link>
        ) : existingMatchStatus === 'pending' ? (
          <button disabled className="btn-secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem 0.875rem', cursor: 'not-allowed', opacity: 0.7 }}>
            Pending
          </button>
        ) : (
          <button onClick={onConnect} className="btn-primary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem 0.875rem' }}>
            <span>Connect</span>
          </button>
        )}
        <Link href={`/profile/${other.id}`} className="btn-secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem 0.875rem', textAlign: 'center', textDecoration: 'none', display: 'block' }}>Profile</Link>
      </div>
    </div>
  );
});
