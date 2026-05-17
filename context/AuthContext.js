'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, login as authLogin, register as authRegister, logout as authLogout } from '@/lib/auth';
import { initStore, updateUser } from '@/lib/data';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initStore();
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const result = authLogin(email, password);
    if (result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const register = useCallback(async (data) => {
    const result = authRegister(data);
    if (result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    authLogout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(() => {
    const fresh = getCurrentUser();
    setUser(fresh);
    return fresh;
  }, []);

  const updateProfile = useCallback((updates) => {
    if (!user) return;
    const updated = updateUser(user.id, updates);
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
