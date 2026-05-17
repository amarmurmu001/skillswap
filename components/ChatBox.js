'use client';

import { useState, useEffect, useRef } from 'react';
import { getMessagesByMatch, addMessage, getUserById } from '@/lib/data';
import { useSocket } from '@/context/SocketContext';
import { timeAgo } from '@/lib/utils';

export default function ChatBox({ matchId, currentUserId, otherUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef(null);
  const { emit, on } = useSocket() || {};

  useEffect(() => {
    if (!matchId) return;
    getMessagesByMatch(matchId).then(setMessages);
  }, [matchId]);

  useEffect(() => {
    if (!on) return;
    return on('new_message', (msg) => {
      if (msg.matchId === matchId) {
        setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
      }
    });
  }, [on, matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !matchId) return;
    setSending(true);
    setInput('');
    const msg = await addMessage(matchId, currentUserId, text);
    if (msg) {
      setMessages(prev => [...prev, msg]);
      emit?.('new_message', msg);
    }
    setSending(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#a0a0c0', gap: '0.75rem' }}>
            <div style={{ fontSize: '3rem' }}>💬</div>
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
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type a message… (Enter to send)" rows={1}
          style={{ flex: 1, resize: 'none', background: 'rgba(17,17,24,0.9)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '1rem', padding: '0.75rem 1rem', color: '#f0f0ff', fontSize: '0.875rem', outline: 'none', maxHeight: 120, overflowY: 'auto', fontFamily: 'Inter,sans-serif', lineHeight: 1.5 }}
          onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.2)'}
        />
        <button type="submit" disabled={!input.trim() || sending} style={{ width: 44, height: 44, borderRadius: '50%', background: input.trim() ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(99,102,241,0.2)', border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', transition: 'all 0.2s', flexShrink: 0 }}>
          {sending ? '…' : '➤'}
        </button>
      </form>
    </div>
  );
}
