'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getMatchesForUser, getUserById, getSkillsByIds, getSkills,
  createMatchRequest, updateMatchStatus, addNotification,
} from '@/lib/data';
import { getMatchSuggestions, matchPercent } from '@/lib/matching';
import MatchCard from '@/components/MatchCard';
import toast from 'react-hot-toast';

export default function MatchesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('suggestions'); // suggestions | pending | active | completed
  const [refresh, setRefresh] = useState(0);

  if (!user) return null;

  const matches      = getMatchesForUser(user.id);
  const suggestions  = getMatchSuggestions(user);

  const byStatus = (status) => matches
    .filter(m => m.status === status)
    .map(m => {
      const otherId = m.userAId === user.id ? m.userBId : m.userAId;
      const other   = getUserById(otherId);
      if (!other) return null;
      return { match: m, user: other };
    })
    .filter(Boolean);

  function handleSendRequest(otherUserId, score, isPerfect) {
    createMatchRequest(user.id, otherUserId, score, isPerfect);
    addNotification({
      userId: otherUserId,
      type: 'match_request',
      title: 'New Match Request',
      message: `${user.name} wants to swap skills with you!`,
      link: '/matches',
    });
    toast.success('Match request sent! ✨');
    setRefresh(r => r + 1);
  }

  function handleAccept(matchId) {
    updateMatchStatus(matchId, 'active');
    toast.success('Match accepted! Start chatting 💬');
    setRefresh(r => r + 1);
  }

  function handleReject(matchId) {
    updateMatchStatus(matchId, 'rejected');
    toast('Match declined.', { icon: '🙅' });
    setRefresh(r => r + 1);
  }

  const existingMatchFor = (otherId) => matches.find(
    m => (m.userAId === otherId || m.userBId === otherId)
  );

  const TABS = [
    { key: 'suggestions', label: '✨ Suggestions', count: suggestions.length },
    { key: 'pending',     label: '⏳ Pending',     count: byStatus('pending').length },
    { key: 'active',      label: '💬 Active',      count: byStatus('active').length },
    { key: 'completed',   label: '✅ Completed',   count: byStatus('completed').length },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem,4vw,2rem)', marginBottom: '0.5rem' }}>
          Skill Matches
        </h1>
        <p style={{ color: '#a0a0c0', fontSize: '0.9rem' }}>
          Discover people you can teach and learn from simultaneously.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
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
              <span style={{
                background: tab === t.key ? '#6366f1' : 'rgba(99,102,241,0.2)',
                color: tab === t.key ? '#fff' : '#818cf8',
                borderRadius: 9999, padding: '0 7px', fontSize: '0.7rem', fontWeight: 700,
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Suggestions tab */}
      {tab === 'suggestions' && (
        <div>
          {suggestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#a0a0c0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
              <h3 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, marginBottom: '0.5rem' }}>No matches found</h3>
              <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>Add more skills to your profile to discover matches</p>
              <a href="/profile" className="btn-primary" style={{ textDecoration: 'none' }}><span>Add Skills</span></a>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#a0a0c0' }}>
                Found <strong style={{ color: '#818cf8' }}>{suggestions.filter(s => s.isPerfect).length} perfect</strong> and{' '}
                <strong style={{ color: '#c7d2fe' }}>{suggestions.filter(s => !s.isPerfect).length} partial</strong> matches
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                {suggestions.map(suggestion => {
                  const existing = existingMatchFor(suggestion.user.id);
                  return (
                    <MatchCard
                      key={suggestion.user.id}
                      match={suggestion}
                      currentUserId={user.id}
                      existingMatchStatus={existing?.status}
                      onSendRequest={handleSendRequest}
                      onAccept={() => existing && handleAccept(existing.id)}
                      onReject={() => existing && handleReject(existing.id)}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Pending / Active / Completed */}
      {['pending', 'active', 'completed'].includes(tab) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {byStatus(tab).length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem 2rem', color: '#a0a0c0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {tab === 'pending' ? '⏳' : tab === 'active' ? '💬' : '✅'}
              </div>
              <h3 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, marginBottom: '0.5rem' }}>
                No {tab} matches
              </h3>
            </div>
          ) : (
            byStatus(tab).map(({ match, user: other }) => {
              const score = match.score || 0;
              const isPerfect = match.isPerfect || false;
              return (
                <MatchCard
                  key={match.id}
                  match={{ user: other, score, isPerfect, iCanTeachThem: [], theyCanTeachMe: [] }}
                  currentUserId={user.id}
                  existingMatchStatus={match.status}
                  onAccept={() => handleAccept(match.id)}
                  onReject={() => handleReject(match.id)}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
