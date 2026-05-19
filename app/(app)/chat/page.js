'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getChatConversations } from '@/lib/data';
import { timeAgo } from '@/lib/utils';
import ChatBox from '@/components/ChatBox';

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const convos = await getChatConversations(user.id);
      setConversations(convos);
      setLoading(false);
    }
    load();
  }, [user]);

  if (!user) return null;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  if (conversations.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '2rem' }}>
      <div style={{ textAlign: 'center', color: '#a0a0c0' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.5rem', color: '#f0f0ff' }}>No conversations yet</h2>
        <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>Accept a match request to start chatting</p>
        <a href="/matches" className="btn-primary" style={{ textDecoration: 'none' }}><span>Find Matches</span></a>
      </div>
    </div>
  );

  const activeConvo = conversations.find(c => c.match.id === activeMatchId) || conversations[0];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem', height: 'calc(100vh - 88px)', display: 'flex', gap: '1.25rem' }}>
      {/* Sidebar */}
      <div style={{ width: 300, flexShrink: 0, background: 'rgba(17,17,24,0.9)', borderRadius: '1.25rem', border: '1px solid rgba(99,102,241,0.12)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.25rem 0.875rem', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
          <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '1rem' }}>
            Messages <span style={{ marginLeft: 8, background: 'rgba(99,102,241,0.15)', color: '#818cf8', borderRadius: 9999, padding: '0 8px', fontSize: '0.72rem' }}>{conversations.length}</span>
          </h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.map(({ match, other, lastMsg }) => {
            const isActive = (activeMatchId || conversations[0]?.match.id) === match.id;
            return (
              <button key={match.id} onClick={() => setActiveMatchId(match.id)} style={{ width: '100%', padding: '1rem 1.25rem', background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent', border: 'none', borderLeft: isActive ? '2px solid #6366f1' : '2px solid transparent', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: '0.75rem', alignItems: 'center', transition: 'all 0.2s' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={other?.avatar} alt={other?.name} style={{ width: 44, height: 44, borderRadius: '50%', background: '#1a1a27' }} />
                  {other?.isOnline && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, background: '#4ade80', borderRadius: '50%', border: '2px solid #111118' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#f0f0ff' }}>{other?.name}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{lastMsg?.content || 'No messages yet'}</div>
                  {lastMsg && <div style={{ color: '#6366f1', fontSize: '0.68rem', marginTop: 2 }}>{timeAgo(lastMsg.createdAt)}</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      {activeConvo && (
        <div style={{ flex: 1, background: 'rgba(17,17,24,0.9)', borderRadius: '1.25rem', border: '1px solid rgba(99,102,241,0.12)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ position: 'relative' }}>
              <img src={activeConvo.other?.avatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', background: '#1a1a27' }} />
              {activeConvo.other?.isOnline && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, background: '#4ade80', borderRadius: '50%', border: '2px solid #111118' }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.975rem' }}>{activeConvo.other?.name}</div>
              <div style={{ color: activeConvo.other?.isOnline ? '#4ade80' : '#6b7280', fontSize: '0.78rem' }}>
                <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: activeConvo.other?.isOnline ? '#4ade80' : '#6b7280', marginRight: 5, verticalAlign: 'middle' }} />
                {activeConvo.other?.isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a href={`https://meet.jit.si/skillswap-${activeConvo.match.id}`} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', textDecoration: 'none' }}><span>Video Call</span></a>
              <a href="/sessions" className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 0.875rem', textDecoration: 'none' }}>Schedule</a>
            </div>
          </div>
          <ChatBox matchId={activeConvo.match.id} currentUserId={user.id} otherUser={activeConvo.other} />
        </div>
      )}
    </div>
  );
}
