// lib/auth.js — Supabase Auth only
import { supabase } from './supabase';

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { user: data.user };
}

export async function register({ name, email, password, bio = '', location = '', skillsOffered = [], skillsWanted = [] }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) {
    if (error.status === 429 || error.message?.toLowerCase().includes('rate limit'))
      return { error: 'Too many attempts. Please wait a few minutes and try again with a different email.' };
    if (error.message?.toLowerCase().includes('already registered'))
      return { error: 'An account with this email already exists. Try logging in.' };
    return { error: error.message };
  }

  // The handle_new_user trigger auto-creates the profile row.
  // We wait a moment then UPDATE it with the extra fields from the form.
  await new Promise(r => setTimeout(r, 800));

  const { error: profileError } = await supabase.from('profiles').update({
    name,
    bio,
    location,
    avatar_url: `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    is_online: true,
  }).eq('id', data.user.id);

  if (profileError) {
    console.warn('Profile update error (non-fatal):', profileError.message);
  }

  const inserts = [];
  if (skillsOffered.length)
    inserts.push(supabase.from('user_skills_offered').insert(skillsOffered.map(skill_id => ({ user_id: data.user.id, skill_id }))));
  if (skillsWanted.length)
    inserts.push(supabase.from('user_skills_wanted').insert(skillsWanted.map(skill_id => ({ user_id: data.user.id, skill_id }))));
  if (inserts.length) await Promise.all(inserts);

  return { user: data.user };
}

export async function logout() {
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      skillsOffered: user_skills_offered(skill_id),
      skillsWanted:  user_skills_wanted(skill_id)
    `)
    .eq('id', user.id)
    .single();

  if (profileError || !profile) return null;

  return {
    ...profile,
    email: user.email,
    avatar: profile.avatar_url,
    rating: Number(profile.rating) || 0,
    totalReviews: profile.total_reviews || 0,
    isOnline: profile.is_online,
    joinedAt: profile.joined_at,
    skillsOffered: profile.skillsOffered.map(r => r.skill_id),
    skillsWanted:  profile.skillsWanted.map(r => r.skill_id),
  };
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
