'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getMessagesByMatch, addMessage, subscribeToMessages } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { timeAgo } from '@/lib/utils';

const PAGE_SIZE   = 50; // messages per page
const SCROLL_THRESHOLD = 120; // px from bottom

export default function ChatBox({ matchId, currentUserId, otherUser }) {
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [sending, setSending]       = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlder, setHasOlder]     = useState(false);
  const [oldestCreatedAt, setOldestCreatedAt] = useState(null);
  const bottomRef     = useRef(null);
  const scrollAreaRef = useRef(null);

  // Initial load: newest PAGE_SIZE messages
  useEffect(() => {
    if (!matchId) return;
    loadLatest();

    const unsub = subscribeToMessages(matchId, (msg) => {
      setMessages(prev => (prev.find(m => m.id === msg.id) ? prev : [...prev, msg]));
    });
    return unsub;
  }, [matchId]);

  async function loadLatest() {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (error || !data) return;
    const normalized = data.reverse().map(m => ({
      id: m.id, matchId: m.match_id, senderId: m.sender_id,
      content: m.content, createdAt: m.created_at,
    }));
    setMessages(normalized);
    if (normalized.length > 0) setOldestCreatedAt(normalized[0].createdAt);
    setHasOlder(data.length === PAGE_SIZE);
    // Scroll to bottom on initial load
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 50);
  }

  async function loadOlderMessages() {
    if (!oldestCreatedAt || loadingOlder) return;
    setLoadingOlder(true);
    const area = scrollAreaRef.current;
    const prevScrollHeight = area?.scrollHeight || 0;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .lt('created_at', oldestCreatedAt)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    setLoadingOlder(false);
    if (error || !data) return;

    const older = data.reverse().map(m => ({
      id: m.id, matchId: m.match_id, senderId: m.sender_id,
      content: m.content, createdAt: m.created_at,
    }));

    setMessages(prev => [...older, ...prev]);
    if (older.length > 0) setOldestCreatedAt(older[0].createdAt);
    setHasOlder(data.length === PAGE_SIZE);

    // Restore scroll position so the user doesn't jump to the top
    requestAnimationFrame(() => {
      if (area) area.scrollTop = area.scrollHeight - prevScrollHeight;
    });
  }

  // Smart auto-scroll: only jump when near bottom or own message
  useEffect(() => {
    if (messages.length === 0) return;
    const latest = messages[messages.length - 1];
    const isOwnMessage = latest?.senderId === currentUserId;
    const area = scrollAreaRef.current;
    if (!area) return;
    const distanceFromBottom = area.scrollHeight - area.scrollTop - area.clientHeight;
    const nearBottom = distanceFromBottom <= SCROLL_THRESHOLD;
    if (isOwnMessage || nearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentUserId]);

  const sendMessage = useCallback(async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !matchId) return;
    setSending(true);
    setInput('');
    try {
      const msg = await addMessage(matchId, currentUserId, text);
      if (msg) setMessages(prev => (prev.find(m => m.id === msg.id) ? prev : [...prev, msg]));
    } catch (err) {
      setInput(text); // restore on failure
    }
    setSending(false);
  }, [input, matchId, currentUserId]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div ref={scrollAreaRef} style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Load older messages button */}
        {hasOlder && (
          <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            <button
              onClick={loadOlderMessages}
              disabled={loadingOlder}
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 9999, padding: '0.35rem 1.25rem', fontSize: '0.78rem', fontWeight: 600, color: '#818cf8', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.14)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
            >
              {loadingOlder ? 'Loading…' : 'Load older messages'}
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#a0a0c0', gap: '0.75rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>No messages yet</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Say hello to start your skill exchange!</div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine = msg.senderId === currentUserId;
          const showAvatar = !isMine && (i === 0 || messages[i - 1]?.senderId !== msg.senderId);
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', gap: '0.5rem', alignItems: 'flex-end' }}>
              {!isMine && (
                <div style={{ width: 28, flexShrink: 0 }}>
                  {showAvatar && <img src={otherUser?.avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a1a27' }} />}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: isMine ? 'flex-end' : 'flex-start', maxWidth: '72%' }}>
                <div style={{ padding: '0.65rem 1rem', borderRadius: isMine ? '1.25rem 1.25rem 0.25rem 1.25rem' : '1.25rem 1.25rem 1.25rem 0.25rem', fontSize: '0.875rem', lineHeight: 1.5, wordBreak: 'break-word', background: isMine ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(26,26,39,0.9)', color: isMine ? '#fff' : '#f0f0ff', border: isMine ? 'none' : '1px solid rgba(99,102,241,0.15)' }}>
                  {msg.content}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#6b7280', paddingInline: 4 }}>{timeAgo(msg.createdAt)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(99,102,241,0.12)', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          rows={1}
          style={{ flex: 1, resize: 'none', background: 'rgba(17,17,24,0.9)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '1rem', padding: '0.75rem 1rem', color: '#f0f0ff', fontSize: '0.875rem', outline: 'none', maxHeight: 120, overflowY: 'auto', fontFamily: 'var(--font-inter, Inter), sans-serif', lineHeight: 1.5 }}
          onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.2)'}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          style={{ width: 44, height: 44, borderRadius: '50%', background: input.trim() ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(99,102,241,0.2)', border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
          aria-label="Send message"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
    </div>
  );
}
