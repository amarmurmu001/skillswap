'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

// Since we're using a demo without a real server, we simulate real-time
// via localStorage events. In production, connect to your Socket.io server.
export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef({});

  useEffect(() => {
    if (!user) return;
    setConnected(true);

    // Listen for storage events (simulates real-time between tabs)
    const handler = (e) => {
      if (e.key === 'ss_socket_event') {
        try {
          const { event, data } = JSON.parse(e.newValue);
          const listeners = listenersRef.current[event] || [];
          listeners.forEach(fn => fn(data));
        } catch {}
      }
    };

    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('storage', handler);
      setConnected(false);
    };
  }, [user]);

  const emit = (event, data) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ss_socket_event', JSON.stringify({ event, data, ts: Date.now() }));
    }
  };

  const on = (event, handler) => {
    if (!listenersRef.current[event]) {
      listenersRef.current[event] = [];
    }
    listenersRef.current[event].push(handler);
    return () => {
      listenersRef.current[event] = listenersRef.current[event].filter(h => h !== handler);
    };
  };

  return (
    <SocketContext.Provider value={{ connected, emit, on }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
