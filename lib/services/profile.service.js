import { supabase } from '@/lib/supabase';
import { cacheFetch, cacheDelete, cacheDeletePrefix, cacheGet, cacheSet } from '@/lib/cache';
import { sanitizeFields } from '@/lib/sanitize';

const TTL = { users: 2 * 60 * 1000, user: 60 * 1000 };

const PROFILE_LIST_SELECT =
  'id, name, bio, avatar_url, location, rating, total_reviews, is_online, banned, joined_at, skillsOffered:user_skills_offered(skill_id), skillsWanted:user_skills_wanted(skill_id)';

const PROFILE_SELECT = '*, skillsOffered:user_skills_offered(skill_id), skillsWanted:user_skills_wanted(skill_id)';

function normalizeProfile(p, authEmail = '') {
  return {
    id: p.id,
    name: p.name,
    email: p.email || authEmail || '',
    bio: p.bio || '',
    avatar: p.avatar_url || `https://api.dicebear.com/8.x/avataaars/svg?seed=${p.id}`,
    location: p.location || '',
    rating: Number(p.rating) || 0,
    totalReviews: p.total_reviews || 0,
    isOnline: p.is_online || false,
    banned: p.banned || false,
    isAdmin: p.is_admin || false,
    joinedAt: p.joined_at,
    skillsOffered: (p.skillsOffered || []).map(r => r.skill_id ?? r),
    skillsWanted: (p.skillsWanted || []).map(r => r.skill_id ?? r),
  };
}

export function invalidateUsersCache() {
  cacheDelete('users:list');
  cacheDeletePrefix('user:');
}

export async function getUsers() {
  return cacheFetch('users:list', TTL.users, async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_LIST_SELECT)
      .eq('banned', false);
    if (error) throw error;
    return (data || []).map(normalizeProfile);
  });
}

export async function getUsersByIds(ids) {
  const unique = [...new Set((ids || []).filter(Boolean))];
  if (!unique.length) return {};

  const map = {};
  const missing = [];
  for (const id of unique) {
    const hit = cacheGet(`user:${id}`);
    if (hit) map[id] = hit;
    else missing.push(id);
  }
  if (missing.length) {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_LIST_SELECT)
      .in('id', missing);
    if (error) throw error;
    for (const row of data || []) {
      const profile = normalizeProfile(row);
      map[row.id] = profile;
      cacheSet(`user:${row.id}`, profile, TTL.user);
    }
  }
  return map;
}

export async function getUserById(id) {
  if (!id) return null;
  const hit = cacheGet(`user:${id}`);
  if (hit) return hit;
  const map = await getUsersByIds([id]);
  return map[id] || null;
}

export async function getAllProfilesForAdmin() {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .order('joined_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeProfile);
}

export async function updateUser(id, updates) {
  const clean = sanitizeFields(updates, ['name', 'bio', 'location']);

  const sbUpdates = {};
  if (clean.name     !== undefined) sbUpdates.name       = clean.name;
  if (clean.bio      !== undefined) sbUpdates.bio        = clean.bio;
  if (clean.location !== undefined) sbUpdates.location   = clean.location;
  if (updates.avatar   !== undefined) sbUpdates.avatar_url = updates.avatar;
  if (updates.rating   !== undefined) sbUpdates.rating     = updates.rating;
  if (updates.totalReviews !== undefined) sbUpdates.total_reviews = updates.totalReviews;
  if (updates.isOnline !== undefined) sbUpdates.is_online  = updates.isOnline;
  if (updates.banned   !== undefined) sbUpdates.banned     = updates.banned;

  if (Object.keys(sbUpdates).length) {
    const { error } = await supabase.from('profiles').update(sbUpdates).eq('id', id);
    if (error) throw error;
    invalidateUsersCache();
  }

  if (updates.skillsOffered !== undefined) {
    await supabase.from('user_skills_offered').delete().eq('user_id', id);
    if (updates.skillsOffered.length) {
      await supabase.from('user_skills_offered').insert(updates.skillsOffered.map(s => ({ user_id: id, skill_id: s })));
    }
  }

  if (updates.skillsWanted !== undefined) {
    await supabase.from('user_skills_wanted').delete().eq('user_id', id);
    if (updates.skillsWanted.length) {
      await supabase.from('user_skills_wanted').insert(updates.skillsWanted.map(s => ({ user_id: id, skill_id: s })));
    }
  }

  return getUserById(id);
}
