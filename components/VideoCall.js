'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import CallEngine, { requestMedia } from '@/lib/webrtc';

const MicOn = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/></svg>;
const MicOff = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="2" x2="22" y2="22"/></svg>;
const CamOn = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>;
const CamOff = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/><line x1="2" y1="2" x2="22" y2="22"/></svg>;
const ScreenIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
const ChatIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const PhoneIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const SendIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const CheckIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

const CONTROL_BTN = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 46, height: 46, borderRadius: '50%', border: 'none', cursor: 'pointer',
  color: '#f0f0ff', background: 'rgba(255,255,255,0.08)',
  transition: 'background 0.15s',
};

export default function VideoCall({ roomName, displayName, userId, onLeave }) {
  const engineRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const onLeaveRef = useRef(onLeave);
  const prejoinVideoRef = useRef(null);

  const [phase, setPhase] = useState('prejoin');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [peerName, setPeerName] = useState('');
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [joining, setJoining] = useState(false);

  const unsubsRef = useRef([]);

  useEffect(() => { onLeaveRef.current = onLeave; }, [onLeave]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (phase !== 'in-call') return;
    const start = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubsRef.current.forEach(u => u());
      engineRef.current?.leave();
    };
  }, []);

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  function setupEngine(stream) {
    const engine = new CallEngine();
    engine.localStream = stream;
    engineRef.current = engine;

    const subs = [
      engine.on('peer-joined', ({ displayName: name }) => {
        setPeerName(name);
      }),
      engine.on('peer-left', () => {
        setPeerName('');
        setPhase('ended');
      }),
      engine.on('remote-stream', (s) => {
        setRemoteStream(s);
      }),
      engine.on('local-stream', (s) => {
        if (localVideoRef.current) localVideoRef.current.srcObject = s;
      }),
      engine.on('state-change', (state) => {
        if (state === 'closed') setPhase('ended');
      }),
      engine.on('chat-message', (msg) => {
        setChatMessages(prev => [...prev, msg]);
      }),
      engine.on('error', (msg) => {
        setError(msg);
        setPhase('ended');
      }),
      engine.on('screen-share-ended', () => {
        setIsSharingScreen(false);
      }),
    ];
    unsubsRef.current = subs;

    engine.join(roomName, userId, displayName).catch((err) => {
      console.error('[VideoCall] join error:', err);
      setError(err.message || 'Failed to join call');
      setPhase('ended');
    });
  }

  const handleJoin = useCallback(async () => {
    setJoining(true);

    try {
      const stream = await requestMedia();
      if (prejoinVideoRef.current) {
        prejoinVideoRef.current.srcObject = stream;
      }
      setJoining(false);
      setupEngine(stream);
      setPhase('in-call');
    } catch (err) {
      console.error('[VideoCall] requestMedia:', err);
      setError(err.message);
      setJoining(false);
      setPhase('ended');
    }
  }, [roomName, userId, displayName]);

  const handleToggleAudio = useCallback(() => {
    const enabled = engineRef.current?.toggleAudio();
    if (enabled !== undefined) setAudioEnabled(enabled);
  }, []);

  const handleToggleVideo = useCallback(() => {
    const enabled = engineRef.current?.toggleVideo();
    if (enabled !== undefined) setVideoEnabled(enabled);
  }, []);

  const handleScreenShare = useCallback(async () => {
    const result = await engineRef.current?.toggleScreenShare();
    if (result === 'screen') setIsSharingScreen(true);
    else if (result === 'camera') setIsSharingScreen(false);
  }, []);

  const handleSendChat = useCallback((e) => {
    e.preventDefault();
    const input = chatInputRef.current;
    if (!input) return;
    engineRef.current?.sendChatMessage(input.value);
    setChatMessages(prev => [...prev, {
      userId, displayName, text: input.value, timestamp: Date.now(),
    }]);
    input.value = '';
  }, [userId, displayName]);

  const handleEndCall = useCallback(() => {
    engineRef.current?.leave();
    onLeaveRef.current?.();
  }, []);

  // ── Pre-join screen ──────────────────────────────────────────────────
  if (phase === 'prejoin') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 48 }}>
            {displayName?.charAt(0).toUpperCase() || '?'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f0f0ff', fontFamily: 'Outfit,sans-serif', marginBottom: 4 }}>{displayName}</div>
          <div style={{ color: '#a0a0c0', fontSize: 14, marginBottom: 24 }}>Ready to start a video call?</div>

          <button onClick={handleJoin} disabled={joining}
            style={{
              width: '100%', padding: '14px 24px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
              fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit,sans-serif',
              opacity: joining ? 0.6 : 1,
            }}>
            {joining ? 'Connecting…' : 'Join Call'}
          </button>

          <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4ade80', fontSize: 13 }}>
              <CheckIcon /> Mic
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4ade80', fontSize: 13 }}>
              <CheckIcon /> Camera
            </div>
          </div>

          <div style={{ marginTop: 24, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
            You'll be asked to allow camera and microphone access. Clicking "Join Call" grants permission for this session only.
          </div>
        </div>
      </div>
    );
  }

  // ── Error screen ─────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#08080e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: '#f0f0ff', padding: 24 }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div style={{ color: '#f87171', fontWeight: 600, textAlign: 'center', maxWidth: 400, fontSize: 15, lineHeight: 1.5 }}>{error}</div>
        <button onClick={handleEndCall} className="btn-primary" style={{ cursor: 'pointer', marginTop: 8 }}>Go back</button>
      </div>
    );
  }

  // ── Ended screen ─────────────────────────────────────────────────────
  if (phase === 'ended') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#08080e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: '#f0f0ff' }}>
        <div style={{ fontSize: 48 }}>📞</div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Call ended</div>
        {elapsed > 0 && <div style={{ color: '#a0a0c0', fontSize: 14 }}>Duration: {fmtTime(elapsed)}</div>}
        <button onClick={handleEndCall} className="btn-primary" style={{ marginTop: 8, cursor: 'pointer' }}>Return to dashboard</button>
      </div>
    );
  }

  // ── In-call UI ───────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0a0a0f', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: peerName ? '#4ade80' : '#facc15' }} />
          <span style={{ fontWeight: 600, fontSize: 14, color: '#f0f0ff' }}>
            {peerName || 'Waiting for someone...'}
          </span>
        </div>
        <span style={{ fontSize: 13, color: '#a0a0c0', fontFamily: 'monospace' }}>
          {fmtTime(elapsed)}
        </span>
      </div>

      {/* Video area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#08080e' }}>
        {remoteStream ? (
          <video ref={remoteVideoRef} autoPlay playsInline
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#08080e' }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#a0a0c0', flexDirection: 'column', gap: 8 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              {displayName?.charAt(0).toUpperCase() || '?'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              <span style={{ fontSize: 13 }}>Waiting for peer to join...</span>
            </div>
          </div>
        )}

        {/* Local video PiP */}
        <div style={{ position: 'absolute', bottom: 16, right: 16, width: 160, height: 120, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', background: '#1a1a27' }}>
          {videoEnabled ? (
            <video ref={localVideoRef} autoPlay playsInline muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0c0', fontSize: 24 }}>
              {displayName?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>

        {/* Chat panel */}
        {chatOpen && (
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 300, maxWidth: '80vw', background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)', borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14, borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#f0f0ff' }}>In-call chat</div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {chatMessages.length === 0 && (
                <div style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', padding: 24 }}>No messages yet</div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.userId === userId ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  {msg.userId !== userId && (
                    <div style={{ fontSize: 11, color: '#818cf8', marginBottom: 2, fontWeight: 600 }}>{msg.displayName}</div>
                  )}
                  <div style={{
                    padding: '6px 12px', borderRadius: 12, fontSize: 13, lineHeight: 1.4,
                    background: msg.userId === userId ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)',
                    color: '#f0f0ff',
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 6, padding: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <input ref={chatInputRef} type="text" placeholder="Type a message..."
                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#f0f0ff', fontSize: 13, outline: 'none' }}
              />
              <button type="submit" style={{ ...CONTROL_BTN, width: 36, height: 36, background: 'rgba(99,102,241,0.2)' }}>
                <SendIcon />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 16px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', flexShrink: 0 }}>
        <button onClick={handleToggleAudio} style={{ ...CONTROL_BTN, background: audioEnabled ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.3)' }} title={audioEnabled ? 'Mute' : 'Unmute'}>
          {audioEnabled ? <MicOn /> : <MicOff />}
        </button>
        <button onClick={handleToggleVideo} style={{ ...CONTROL_BTN, background: videoEnabled ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.3)' }} title={videoEnabled ? 'Camera off' : 'Camera on'}>
          {videoEnabled ? <CamOn /> : <CamOff />}
        </button>
        <button onClick={handleScreenShare} style={{ ...CONTROL_BTN, background: isSharingScreen ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)' }} title={isSharingScreen ? 'Stop sharing' : 'Share screen'}>
          <ScreenIcon />
        </button>
        <button onClick={() => setChatOpen(v => !v)} style={{ ...CONTROL_BTN, background: chatOpen ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)' }} title="Chat">
          <ChatIcon />
        </button>
        <button onClick={handleEndCall} style={{ ...CONTROL_BTN, width: 52, height: 52, background: '#dc2626' }} title="End call">
          <PhoneIcon />
        </button>
      </div>
    </div>
  );
}
