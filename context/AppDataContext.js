'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { getSkills, getUsers, invalidateUsersCache } from '@/lib/data';
import { cacheGet } from '@/lib/cache';

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [users, setUsers]   = useState([]);
  const [ready, setReady]   = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // ─── Eager skill prefetch ────────────────────────────────────────────────
  useEffect(() => {
    getSkills().then(skills => {
      if (mountedRef.current) setSkills(skills);
    }).catch(() => {});
  }, []);

  // ─── User list with stale-while-revalidate ───────────────────────────────
  useEffect(() => {
    if (!user) {
      setUsers([]);
      setReady(false);
      return;
    }

    let cancelled = false;

    async function load() {
      const cached = cacheGet('users:list');
      if (cached) {
        if (!cancelled) { setUsers(cached); setReady(true); }
        try {
          const fresh = await getUsers();
          if (!cancelled) setUsers(fresh);
        } catch {}
        return;
      }

      if (!cancelled) setReady(false);
      try {
        const [userList, skillList] = await Promise.all([getUsers(), getSkills()]);
        if (!cancelled) {
          setUsers(userList);
          setSkills(skillList);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    load();

    return () => { cancelled = true; };
  }, [user?.id]);

  const skillsById = useMemo(
    () => Object.fromEntries(skills.map(s => [s.id, s])),
    [skills]
  );

  const resolveSkills = useCallback(
    (ids) => (ids || []).map(id => skillsById[id]).filter(Boolean),
    [skillsById]
  );

  const refreshUsers = useCallback(async () => {
    invalidateUsersCache();
    const userList = await getUsers();
    if (mountedRef.current) setUsers(userList);
    return userList;
  }, []);

  const value = useMemo(() => ({ skills, skillsById, users, ready, resolveSkills, refreshUsers }), [skills, skillsById, users, ready, resolveSkills, refreshUsers]);

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
}
