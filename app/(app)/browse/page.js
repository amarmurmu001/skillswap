'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSkillsByIds, createMatchRequest, addNotification } from '@/lib/data';
import { browseUsers } from '@/lib/matching';
import SkillTag from '@/components/SkillTag';
import StarRating from '@/components/StarRating';
import Link from 'next/link';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Tech', 'Music', 'Language', 'Art', 'Fitness', 'Lifestyle', 'Games', 'Professional'];

export default function BrowsePage() {
  const { user } = useAuth();
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy]     = useState('match'); // match | rating | name

  if (!user) return null;

  const allUsers = browseUsers(user);

  const filtered = useMemo(() => {
    let list = allUsers.filter(({ user: u }) => {
      const q = search.toLowerCase();
      if (q && !u.name.toLowerCase().includes(q) &&
          !u.bio?.toLowerCase().includes(q) &&
          !u.location?.toLowerCase().includes(q)) return false;
      if (category !== 'All') {
        const skills = getSkillsByIds([...u.skillsOffered, ...u.skillsWanted]);
        if (!skills.some(s => s.category === category)) return false;
      }
      return true;
    });

    if (sortBy === 'rating') list = [...list].sort((a, b) => b.user.rating - a.user.rating);
    if (sortBy === 'name')   list = [...list].sort((a, b) => a.user.name.localeCompare(b.user.name));
    return list;
  }, [allUsers, search, category, sortBy]);

  function handleConnect(otherId, score, isPerfect) {
    createMatchRequest(user.id, otherId, score, isPerfect);
    addNotification({
      userId: otherId,
      type: 'match_request',
      title: 'New Match Request',
      message: `${user.name} wants to swap skills with you!`,
      link: '/matches',
    });
    toast.success('Connection request sent! ✨');
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem,4vw,2rem)', marginBottom: '0.5rem' }}>
          Browse Community
        </h1>
        <p style={{ color: '#a0a0c0', fontSize: '0.9rem' }}>
          Explore all {allUsers.length} members — even partial matches can start great exchanges.
        </p>
      </div>

      {/* Search & filters */}
      <div style={{ display: 'flex', gap: '0.875rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="input-field"
          placeholder="🔍 Search by name, bio, location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 220px', minWidth: 0 }}
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="input-field"
          style={{ flex: '0 0 auto', width: 'auto', cursor: 'pointer' }}
        >
          <option value="match">Sort: Best Match</option>
          <option value="rating">Sort: Rating</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: 9999,
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: category === cat ? 'rgba(99,102,241,0.2)' : 'rgba(17,17,24,0.8)',
              color: category === cat ? '#818cf8' : '#a0a0c0',
              border: `1px solid ${category === cat ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#a0a0c0' }}>
        Showing <strong style={{ color: '#f0f0ff' }}>{filtered.length}</strong> members
      </div>

      {/* User grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.25rem' }}>
        {filtered.map(({ user: other, score, isPerfect }) => {
          const offeredSkills = getSkillsByIds(other.skillsOffered).slice(0, 3);
          const wantedSkills  = getSkillsByIds(other.skillsWanted).slice(0, 3);

          return (
            <div key={other.id} className="glass-card group" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <img src={other.avatar} alt={other.name} style={{ width: 56, height: 56, borderRadius: '50%', background: '#1a1a27', border: isPerfect ? '2px solid #6366f1' : '2px solid rgba(99,102,241,0.2)' }} />
                  {other.isOnline && <div style={{ position: 'absolute', bottom: 2, right: 2, width: 10, height: 10, background: '#4ade80', borderRadius: '50%', border: '2px solid #0a0a0f' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {other.name}
                    {isPerfect && <span style={{ marginLeft: 6, fontSize: '0.65rem', color: '#818cf8', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 9999, padding: '0 5px' }}>⚡ Match</span>}
                  </div>
                  <div style={{ color: '#a0a0c0', fontSize: '0.78rem' }}>📍 {other.location || 'Worldwide'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: 2 }}>
                    <StarRating value={Math.round(other.rating)} readonly size="sm" />
                    <span style={{ fontSize: '0.72rem', color: '#a0a0c0' }}>{other.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {other.bio && (
                <p style={{ color: '#a0a0c0', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '1rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {other.bio}
                </p>
              )}

              {offeredSkills.length > 0 && (
                <div style={{ marginBottom: '0.625rem' }}>
                  <div style={{ fontSize: '0.68rem', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>Teaches</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {offeredSkills.map(s => <SkillTag key={s.id} skill={s} variant="offer" size="sm" />)}
                    {other.skillsOffered.length > 3 && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>+{other.skillsOffered.length - 3}</span>}
                  </div>
                </div>
              )}

              {wantedSkills.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.68rem', color: '#d946ef', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>Learning</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {wantedSkills.map(s => <SkillTag key={s.id} skill={s} variant="want" size="sm" />)}
                    {other.skillsWanted.length > 3 && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>+{other.skillsWanted.length - 3}</span>}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleConnect(other.id, score, isPerfect)}
                  className="btn-primary"
                  style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem 0.875rem' }}
                >
                  <span>Connect</span>
                </button>
                <Link
                  href={`/profile/${other.id}`}
                  className="btn-secondary"
                  style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem 0.875rem', textAlign: 'center', textDecoration: 'none', display: 'block' }}
                >
                  Profile
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#a0a0c0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, marginBottom: '0.5rem' }}>No users found</h3>
          <p style={{ fontSize: '0.875rem' }}>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
