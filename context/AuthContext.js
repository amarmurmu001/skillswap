'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
    // Fast path on mount:
    // getSessionUser() reads the JWT from localStorage (no server round-trip),
    // then fetches the profile — only 1 network hop instead of 2.
    // This eliminates the blank-spinner delay on return visits.
    getSessionUser().then(u => {
      setUser(u);
      setLoading(false);
    });

    // Auth state changes (login, logout, token refresh) still go through
    // getCurrentUser() which validates the JWT with the server.
    const { data: { subscription } } = onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const u = await getCurrentUser();
        setUser(u);
      }
      if (event === 'SIGNED_OUT') setUser(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await authLogin(email, password);
    if (!result.error) setUser(result.user ?? (await getCurrentUser()));
    return result;
  }, []);

  const register = useCallback(async (data) => {
    const result = await authRegister(data);
    if (!result.error) setUser(result.user ?? (await getCurrentUser()));
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

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
