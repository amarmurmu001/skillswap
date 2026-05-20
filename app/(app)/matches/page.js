'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMatchesForUser, getUsersByIds, createMatchRequest, updateMatchStatus, addNotification } from '@/lib/data';
import { getMatchSuggestionsFromList } from '@/lib/matching';
import { useAppData } from '@/context/AppDataContext';
import MatchCard from '@/components/MatchCard';
import toast from 'react-hot-toast';

export default function MatchesPage() {
  const { user } = useAuth();
  const { users, ready } = useAppData();
  const [tab, setTab]           = useState('suggestions');
  const [suggestions, setSuggestions] = useState([]);
  const [matches, setMatches]   = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const m = await getMatchesForUser(user.id);
    setMatches(m);
    if (ready) setSuggestions(getMatchSuggestionsFromList(user, users));
    setLoading(false);
  }, [user?.id, ready, users]);

  useEffect(() => { load(); }, [load]);

  async function handleSendRequest(otherUserId, score, isPerfect) {
    await createMatchRequest(user.id, otherUserId, score, isPerfect);
    await addNotification({ userId: otherUserId, type: 'match_request', title: 'New Match Request', message: `${user.name} wants to swap skills with you!`, link: '/matches' });
    toast.success('Match request sent! ✨');
    load();
  }

  async function handleAccept(matchId) {
    await updateMatchStatus(matchId, 'active');
    toast.success('Match accepted! 💬');
    load();
  }

  async function handleReject(matchId) {
    await updateMatchStatus(matchId, 'rejected');
    toast('Match declined.', { icon: '🙅' });
    load();
  }

  const byStatus = (status) => matches.filter(m => m.status === status);
  const pendingForMe = matches.filter(m => m.status === 'pending' && m.userBId === user?.id);
  const existingMatchFor = (otherId) => matches.find(m => m.userAId === otherId || m.userBId === otherId);

  const TABS = [
    { key: 'suggestions', label: 'Suggestions', count: suggestions.length },
    { key: 'pending',     label: 'Pending',     count: byStatus('pending').length + pendingForMe.length },
    { key: 'active',      label: 'Active',      count: byStatus('active').length },
    { key: 'rejected',    label: 'Declined',    count: byStatus('rejected').length },
  ];

  if (!user) return null;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem,4vw,2rem)', marginBottom: '0.5rem' }}>Skill Matches</h1>
        <p style={{ color: '#a0a0c0', fontSize: '0.9rem' }}>Discover people you can teach and learn from simultaneously.</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '0.5rem 1.25rem', borderRadius: '0.875rem', background: tab === t.key ? 'rgba(99,102,241,0.15)' : 'transparent', border: `1px solid ${tab === t.key ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.12)'}`, color: tab === t.key ? '#818cf8' : '#a0a0c0', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {t.label}
            {t.count > 0 && <span style={{ background: tab === t.key ? '#6366f1' : 'rgba(99,102,241,0.2)', color: tab === t.key ? '#fff' : '#818cf8', borderRadius: 9999, padding: '0 7px', fontSize: '0.7rem', fontWeight: 700 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><div className="spinner" /></div>
      ) : tab === 'suggestions' ? (
        suggestions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#a0a0c0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
            <h3 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, marginBottom: '0.5rem' }}>No matches found</h3>
            <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>Add more skills to discover matches</p>
            <a href="/profile" className="btn-primary" style={{ textDecoration: 'none' }}><span>Add Skills</span></a>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {suggestions.map(suggestion => {
              const existing = existingMatchFor(suggestion.user.id);
              return (
                <MatchCard key={suggestion.user.id} match={suggestion} currentUserId={user.id} existingMatchStatus={existing?.status} existingMatchSenderId={existing?.userAId}
                  onSendRequest={handleSendRequest}
                  onAccept={() => existing && handleAccept(existing.id)}
                  onReject={() => existing && handleReject(existing.id)}
                />
              );
            })}
          </div>
        )
      ) : (
        <MatchListByStatus matches={byStatus(tab)} userId={user.id} onAccept={handleAccept} onReject={handleReject} />
      )}
    </div>
  );
}

function MatchListByStatus({ matches, userId, onAccept, onReject }) {
  const [enriched, setEnriched] = useState([]);
  useEffect(() => {
    if (!matches.length) {
      setEnriched([]);
      return;
    }
    const otherIds = matches.map(m => (m.userAId === userId ? m.userBId : m.userAId));
    getUsersByIds(otherIds).then(map => {
      setEnriched(
        matches
          .map(m => {
            const otherId = m.userAId === userId ? m.userBId : m.userAId;
            const other = map[otherId];
            return other ? { match: m, other } : null;
          })
          .filter(Boolean)
      );
    });
  }, [matches, userId]);

  if (enriched.length === 0) return (
    <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#a0a0c0' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
      <h3 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700 }}>No matches here yet</h3>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
      {enriched.map(({ match, other }) => (
        <MatchCard key={match.id}
          match={{ user: other, score: match.score || 0, isPerfect: match.isPerfect || false, iCanTeachThem: [], theyCanTeachMe: [] }}
          currentUserId={userId} existingMatchStatus={match.status} existingMatchSenderId={match.userAId}
          onAccept={() => onAccept(match.id)} onReject={() => onReject(match.id)}
        />
      ))}
    </div>
  );
}
