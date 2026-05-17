// lib/auth.js
// Simple JWT-like auth using localStorage (no real crypto needed for demo).
// Replace with next-auth + bcrypt for production.

import { getUserByEmail, createUser, getUserById } from './data';

const TOKEN_KEY = 'ss_token';
const CURRENT_USER_KEY = 'ss_current_user';

const isClient = typeof window !== 'undefined';

// Very simple "token" — just the user ID stored in localStorage.
// Production: use httpOnly cookie + JWT.

export function login(email, password) {
  const user = getUserByEmail(email);
  if (!user) return { error: 'No account found with that email.' };
  if (user.password !== password) return { error: 'Incorrect password.' };
  if (isClient) {
    localStorage.setItem(TOKEN_KEY, user.id);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
  return { user };
}

export function register(data) {
  const existing = getUserByEmail(data.email);
  if (existing) return { error: 'An account with this email already exists.' };
  const newUser = createUser(data);
  if (isClient) {
    localStorage.setItem(TOKEN_KEY, newUser.id);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  }
  return { user: newUser };
}

export function logout() {
  if (isClient) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function getCurrentUser() {
  if (!isClient) return null;
  const id = localStorage.getItem(TOKEN_KEY);
  if (!id) return null;
  // Always get fresh data from store
  return getUserById(id);
}

export function isAuthenticated() {
  if (!isClient) return false;
  return !!localStorage.getItem(TOKEN_KEY);
}
