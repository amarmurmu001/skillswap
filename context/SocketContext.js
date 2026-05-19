'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

const SocketContext = createContext(null);

/**
 * Provides real-time event delivery via Supabase Realtime.
 *
 * Replaces the old localStorage cross-tab hack — now works across
 * different devices and users via Postgres CDC.
 *
 * Supported events emitted to listeners:
 *   - 'new_notification'  — fired when a new notifications row is inserted
 *                           for the current user.
 */
export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef({});

  // ─── Supabase Realtime: notifications ─────────────────────────────────────
  useEffect(() => {
    if (!user?.id) {
      setConnected(false);
      return;
    }

    const channel = supabase
      .channel(`notifications:user:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const raw = payload.new;
          const notification = {
            id:        raw.id,
            userId:    raw.user_id,
            type:      raw.type,
            title:     raw.title,
            message:   raw.message,
            isRead:    raw.is_read,
            link:      raw.link,
            createdAt: raw.created_at,
          };
          const handlers = listenersRef.current['new_notification'] || [];
          handlers.forEach((fn) => fn(notification));
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setConnected(false);
    };
  }, [user?.id]);

  /**
   * Register a listener for a named event.
   * Returns an unsubscribe function.
   */
  const on = (event, handler) => {
    if (!listenersRef.current[event]) {
      listenersRef.current[event] = [];
    }
    listenersRef.current[event].push(handler);
    return () => {
      listenersRef.current[event] = listenersRef.current[event].filter(
        (h) => h !== handler
      );
    };
  };

  /**
   * Emit an event locally (same-tab only).
   * Kept for backwards-compatibility; server-side events arrive via Realtime.
   */
  const emit = (event, data) => {
    const handlers = listenersRef.current[event] || [];
    handlers.forEach((fn) => fn(data));
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
