'use client';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getCurrentUser,
  getSessionUser,
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  onAuthStateChange,
} from '@/lib/auth';
import { updateUser } from '@/lib/data';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSessionUser()
      .then(u => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    const { data: { subscription } } = onAuthStateChange(async (event) => {
      try {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const u = await getCurrentUser();
          setUser(u);
        }
        if (event === 'SIGNED_OUT') setUser(null);
      } catch (err) {
        console.error('[AuthContext] auth state change error:', err);
      }
    });

    return () => subscription?.unsubscribe?.();
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await authLogin(email, password);
    if (!result.error) setUser(result.user ?? (await getCurrentUser()));
    return result;
  }, []);

  const register = useCallback(async (data) => {
    const result = await authRegister(data);
    if (!result.error && !result.needsConfirm) setUser(result.user ?? (await getCurrentUser()));
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const fresh = await getCurrentUser();
    setUser(fresh);
    return fresh;
  }, []);

  const updateProfile = useCallback(async (updates) => {
    if (!user) return;
    const updated = await updateUser(user.id, updates);
    setUser(updated);
    return updated;
  }, [user]);

  const value = useMemo(() => ({ user, loading, login, register, logout, refreshUser, updateProfile }), [user, loading, login, register, logout, refreshUser, updateProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
