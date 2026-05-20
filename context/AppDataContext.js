'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { getSkills, getUsers, invalidateUsersCache } from '@/lib/data';
import { cacheGet } from '@/lib/cache';

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [users, setUsers]   = useState([]);
  const [ready, setReady]   = useState(false);

  // ─── Eager skill prefetch ────────────────────────────────────────────────
  // Skills are a public read (no RLS restriction) and rarely change.
  // Start fetching immediately on mount — don't wait for auth to resolve.
  // getSkills() uses cacheFetch internally so repeated calls are free.
  useEffect(() => {
    getSkills().then(setSkills).catch(() => {});
  }, []); // intentionally runs once, independent of user

  // ─── User list with stale-while-revalidate ───────────────────────────────
  const load = useCallback(async () => {
    if (!user) {
      setUsers([]);
      setReady(false);
      return;
    }

    // If the in-memory cache already has a user list (from a previous load or
    // a recently completed fetch), serve it immediately so pages render at
    // once — no spinner. Then revalidate in the background so data stays fresh.
    const cached = cacheGet('users:list');
    if (cached) {
      setUsers(cached);
      setReady(true);
      // Background revalidation — silently updates the list
      getUsers()
        .then(fresh => setUsers(fresh))
        .catch(() => {});
      return;
    }

    // No cache — first load. Fetch and block until done.
    setReady(false);
    try {
      const [userList, skillList] = await Promise.all([getUsers(), getSkills()]);
      setUsers(userList);
      setSkills(skillList);
    } finally {
      setReady(true);
    }
  }, [user?.id]); // stable — only changes when the logged-in user changes

  useEffect(() => {
    load();
  }, [load]);

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
    setUsers(userList);
    return userList;
  }, []);

  return (
    <AppDataContext.Provider
      value={{ skills, skillsById, users, ready, resolveSkills, refreshUsers, reload: load }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
}
