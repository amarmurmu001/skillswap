// lib/auth.js — Supabase Auth only
import { supabase } from './supabase';

const PROFILE_SELECT = `
  *,
  skillsOffered: user_skills_offered(skill_id),
  skillsWanted:  user_skills_wanted(skill_id)
`;

export function mapProfileToUser(profile, authEmail = '') {
  if (!profile) return null;
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email || authEmail || '',
    bio: profile.bio || '',
    avatar: profile.avatar_url || `https://api.dicebear.com/8.x/avataaars/svg?seed=${profile.id}`,
    location: profile.location || '',
    rating: Number(profile.rating) || 0,
    totalReviews: profile.total_reviews || 0,
    isOnline: profile.is_online || false,
    banned: profile.banned || false,
    isAdmin: profile.is_admin || false,
    joinedAt: profile.joined_at,
    skillsOffered: (profile.skillsOffered || []).map(r => r.skill_id),
    skillsWanted: (profile.skillsWanted || []).map(r => r.skill_id),
  };
}

async function fetchProfile(userId, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', userId)
      .maybeSingle();
    if (!error && data) return data;
    if (i < retries - 1) await new Promise(r => setTimeout(r, 800));
  }
  return null;
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const profile = await fetchProfile(data.user.id);
  if (profile?.banned) {
    await supabase.auth.signOut();
    return { error: 'Your account has been suspended. Contact support if you believe this is a mistake.' };
  }

  return { user: mapProfileToUser(profile, data.user.email) };
}

export async function register({ name, email, password, bio = '', location = '', skillsOffered = [], skillsWanted = [] }) {
  const avatar = `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        bio,
        location,
        avatar_url: avatar
      }
    },
  });
  if (error) {
    if (error.status === 429 || error.message?.toLowerCase().includes('rate limit'))
      return { error: 'Too many attempts. Please wait a few minutes and try again with a different email.' };
    if (error.message?.toLowerCase().includes('already registered'))
      return { error: 'An account with this email already exists. Try logging in.' };
    return { error: error.message };
  }

  const emailConfirm = !data.session;
  if (!emailConfirm) {
    try {
      const inserts = [];
      if (skillsOffered.length)
        inserts.push(supabase.from('user_skills_offered').insert(skillsOffered.map(skill_id => ({ user_id: data.user.id, skill_id }))));
      if (skillsWanted.length)
        inserts.push(supabase.from('user_skills_wanted').insert(skillsWanted.map(skill_id => ({ user_id: data.user.id, skill_id }))));
      if (inserts.length) await Promise.all(inserts);
    } catch (_) {}
  }

  const profile = await fetchProfile(data.user.id, emailConfirm ? 8 : 3);
  if (emailConfirm) return { needsConfirm: true, user: null };
  return { user: mapProfileToUser(profile, data.user.email) };
}

export async function logout() {
  await supabase.auth.signOut();
}

/**
 * Fast bootstrap — reads the stored JWT from localStorage via getSession()
 * (zero network round-trip), then fetches the profile with a single DB query.
 *
 * Replaces getUser() on initial mount:
 *   Before: getUser() [server verify] → fetchProfile()  = 2 sequential hops
 *   After:  getSession() [localStorage] → fetchProfile() = 1 hop
 *
 * Auth-state changes (SIGNED_IN, TOKEN_REFRESHED) still call getCurrentUser()
 * which validates the JWT with the server for full security.
 */
export async function getSessionUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const profile = await fetchProfile(session.user.id);
  if (!profile || profile.banned) return null;

  return mapProfileToUser(profile, session.user.email);
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const profile = await fetchProfile(user.id);
  if (!profile || profile.banned) return null;

  return mapProfileToUser(profile, user.email);
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
