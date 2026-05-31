'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

/** @typedef {'connecting' | 'connected' | 'error' | 'disconnected'} SocketStatus */

const SocketContext = createContext(null);

/**
 * Provides real-time event delivery via Supabase Realtime.
 *
 * Replaces the old localStorage cross-tab hack — now works across
 * different devices and users via Postgres CDC.
 *
 * Supported events emitted to listeners:
 *   - 'new_notification' — fired when a new notifications row is inserted
 *                          for the current user.
 */
export function SocketProvider({ children }) {
  const { user } = useAuth();

  /** @type {[SocketStatus, React.Dispatch<React.SetStateAction<SocketStatus>>]} */
  const [status, setStatus] = useState('disconnected');

  // Stable map of event → list of handlers. Never reassigned, so safe to
  // reference inside callbacks without adding to dependency arrays.
  const listenersRef = useRef(/** @type {Record<string, Function[]>} */ ({}));

  // ─── Supabase Realtime subscription ──────────────────────────────────────
  useEffect(() => {
    if (!user?.id) {
      setStatus('disconnected');
      // Clear all listeners when the user logs out so stale handlers from a
      // previous session don't fire if a new user logs in on the same tab.
      listenersRef.current = {};
      return;
    }

    setStatus('connecting');

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
          _dispatch('new_notification', notification);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[SocketContext] Realtime error:', status, err);
          setStatus('error');
        } else if (status === 'CLOSED') {
          setStatus('disconnected');
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setStatus('disconnected');
    };
  }, [user?.id]);

  // ─── Internal dispatcher ──────────────────────────────────────────────────
  // Not exposed — callers use `emit` for same-tab events.
  function _dispatch(event, data) {
    (listenersRef.current[event] ?? []).forEach((fn) => fn(data));
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Register a listener for a named event.
   * Returns an unsubscribe function — always call it from a useEffect cleanup.
   *
   * @param {string} event
   * @param {Function} handler
   * @returns {() => void} unsubscribe
   */
  const on = useCallback((event, handler) => {
    const listeners = listenersRef.current;
    listeners[event] ??= [];
    listeners[event].push(handler);

    return () => {
      listeners[event] = listeners[event].filter((h) => h !== handler);
    };
  }, []); // stable — listenersRef never changes identity

  /**
   * Emit an event to all same-tab listeners.
   * Kept for backwards-compatibility; cross-device events arrive via Realtime.
   *
   * @param {string} event
   * @param {unknown} data
   */
  const emit = useCallback((event, data) => {
    _dispatch(event, data);
  }, []);

  const value = useMemo(() => ({
    connected: status === 'connected',
    status,
    on,
    emit,
  }), [status, on, emit]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket must be used inside <SocketProvider>');
  }
  return ctx;
}