// lib/data.js — Supabase only, no localStorage
import { supabase } from './supabase';
import { cacheDelete, cacheDeletePrefix, cacheFetch, cacheGet, cacheSet } from './cache';
import { sanitizeText, sanitizeFields } from './sanitize';
import { assertRateLimit } from './rateLimit';

const TTL = {
  users: 2 * 60 * 1000,
  skills: 10 * 60 * 1000,
  user: 60 * 1000,
  matches: 30 * 1000,
  notifications: 20 * 1000,
};

// ─── Normalizers (snake_case → camelCase) ────────────────────────────────────
function normalizeProfile(p, authEmail = '') {
  return {
    id:           p.id,
    name:         p.name,
    email:        p.email || authEmail || '',
    bio:          p.bio || '',
    avatar:       p.avatar_url || `https://api.dicebear.com/8.x/avataaars/svg?seed=${p.id}`,
    location:     p.location || '',
    rating:       Number(p.rating) || 0,
    totalReviews: p.total_reviews || 0,
    isOnline:     p.is_online || false,
    banned:       p.banned || false,
    isAdmin:      p.is_admin || false,
    joinedAt:     p.joined_at,
    skillsOffered: (p.skillsOffered || []).map(r => r.skill_id ?? r),
    skillsWanted:  (p.skillsWanted  || []).map(r => r.skill_id ?? r),
  };
}

function normalizeMatch(m) {
  return {
    id:        m.id,
    userAId:   m.user_a_id,
    userBId:   m.user_b_id,
    status:    m.status,
    score:     m.score || 0,
    isPerfect: m.is_perfect || false,
    createdAt: m.created_at,
  };
}

export function normalizeMessage(m) {
  return {
    id:        m.id,
    matchId:   m.match_id,
    senderId:  m.sender_id,
    content:   m.content,
    createdAt: m.created_at,
  };
}

function normalizeReview(r) {
  return {
    id:          r.id,
    reviewerId:  r.reviewer_id,
    revieweeId:  r.reviewee_id,
    matchId:     r.match_id,
    rating:      r.rating,
    comment:     r.comment,
    skillTaught: r.skill_taught,
    createdAt:   r.created_at,
  };
}

function normalizeNotification(n) {
  return {
    id:        n.id,
    userId:    n.user_id,
    type:      n.type,
    title:     n.title,
    message:   n.message,
    isRead:    n.is_read,
    link:      n.link,
    createdAt: n.created_at,
  };
}

// ─── USERS ───────────────────────────────────────────────────────────────────

const PROFILE_SELECT = '*, skillsOffered:user_skills_offered(skill_id), skillsWanted:user_skills_wanted(skill_id)';

/** List column subset for browse/matching (smaller payload). */
const PROFILE_LIST_SELECT =
  'id, name, bio, avatar_url, location, rating, total_reviews, is_online, banned, joined_at, skillsOffered:user_skills_offered(skill_id), skillsWanted:user_skills_wanted(skill_id)';

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

/** Batch-fetch profiles by id → { [id]: profile } */
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

/** Admin: all profiles including banned */
export async function getAllProfilesForAdmin() {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .order('joined_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeProfile);
}

/** Admin: all matches */
export async function getAllMatchesForAdmin() {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeMatch);
}

export async function getUserById(id) {
  if (!id) return null;
  const hit = cacheGet(`user:${id}`);
  if (hit) return hit;
  const map = await getUsersByIds([id]);
  return map[id] || null;
}

// ─── STATS (landing page) ────────────────────────────────────────────────────

/**
 * Returns live community stats from Supabase.
 * Uses COUNT with `head: true` so no rows are transferred.
 *
 * Note: `swaps` (match count) will be 0 for unauthenticated visitors
 * because the matches RLS policy restricts SELECT to participants only.
 * It gracefully renders '—' in that case on the landing page.
 * Members and avgRating are publicly readable.
 */
export async function getStats() {
  const [membersRes, swapsRes, ratingsRes] = await Promise.all([
    // Total active (non-banned) members
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('banned', false),

    // Total completed + active matches ("skill swaps")
    supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'completed']),

    // All review ratings for average calculation
    supabase
      .from('reviews')
      .select('rating'),
  ]);

  const members    = membersRes.count ?? 0;
  const swaps      = swapsRes.count ?? 0;
  const allRatings = ratingsRes.data ?? [];
  const avgRating  =
    allRatings.length > 0
      ? (allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length).toFixed(1)
      : null;

  return { members, swaps, avgRating };
}

export async function updateUser(id, updates) {
  // Sanitize user-editable text fields before saving
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
    if (updates.skillsOffered.length)
      await supabase.from('user_skills_offered').insert(updates.skillsOffered.map(s => ({ user_id: id, skill_id: s })));
  }

  if (updates.skillsWanted !== undefined) {
    await supabase.from('user_skills_wanted').delete().eq('user_id', id);
    if (updates.skillsWanted.length)
      await supabase.from('user_skills_wanted').insert(updates.skillsWanted.map(s => ({ user_id: id, skill_id: s })));
  }

  return getUserById(id);
}

// ─── SKILLS ──────────────────────────────────────────────────────────────────

export async function getSkills() {
  return cacheFetch('skills:all', TTL.skills, async () => {
    const { data, error } = await supabase.from('skills').select('id, name, category').order('category').order('name');
    if (error) {
      console.error('getSkills error:', error.message, '— Have you run supabase/schema.sql?');
      return [];
    }
    return data || [];
  });
}

export async function getSkillsByIds(ids) {
  if (!ids?.length) return [];
  const all = await getSkills();
  const set = new Set(ids);
  return all.filter(s => set.has(s.id));
}

export async function getSkillById(id) {
  const { data } = await supabase.from('skills').select('*').eq('id', id).single();
  return data || null;
}

// ─── MATCHES ─────────────────────────────────────────────────────────────────

export async function getMatchesForUser(userId) {
  return cacheFetch(`matches:${userId}`, TTL.matches, async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(normalizeMatch);
  });
}

function invalidateMatchesCache(userId) {
  if (userId) cacheDelete(`matches:${userId}`);
  cacheDeletePrefix('matches:');
}

export async function getMatchById(id) {
  const { data } = await supabase.from('matches').select('*').eq('id', id).single();
  return data ? normalizeMatch(data) : null;
}

export async function createMatchRequest(userAId, userBId, score, isPerfect) {
  // Rate-limit: max 20 match requests per hour per user
  assertRateLimit(
    `match_request:${userAId}`,
    20,
    60 * 60 * 1000,
    'You\'re sending too many requests. Please wait before connecting with more people.'
  );

  const { data: candidates, error: findError } = await supabase
    .from('matches')
    .select('*')
    .or(`user_a_id.eq.${userAId},user_b_id.eq.${userAId}`);
  if (findError) throw findError;
  const existing = (candidates || []).find(
    m =>
      (m.user_a_id === userAId && m.user_b_id === userBId) ||
      (m.user_a_id === userBId && m.user_b_id === userAId)
  );
  if (existing) {
    invalidateMatchesCache(userAId);
    invalidateMatchesCache(userBId);
    return normalizeMatch(existing);
  }

  const { data, error } = await supabase
    .from('matches')
    .insert({ user_a_id: userAId, user_b_id: userBId, status: 'pending', score, is_perfect: isPerfect })
    .select()
    .single();
  if (error) throw error;
  invalidateMatchesCache(userAId);
  invalidateMatchesCache(userBId);
  return normalizeMatch(data);
}

export async function updateMatchStatus(matchId, status) {
  const { error } = await supabase.from('matches').update({ status }).eq('id', matchId);
  if (error) throw error;
  invalidateMatchesCache();
}

// ─── MESSAGES ────────────────────────────────────────────────────────────────

export async function getMessagesByMatch(matchId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at');
  if (error) throw error;
  return (data || []).map(normalizeMessage);
}

export async function addMessage(matchId, senderId, content) {
  // Sanitize content and rate-limit (60 messages per minute per match)
  const cleanContent = sanitizeText(content);
  if (!cleanContent) return null;
  assertRateLimit(
    `message:${senderId}:${matchId}`,
    60,
    60 * 1000,
    'You\'re sending messages too fast. Please slow down.'
  );

  const { data, error } = await supabase
    .from('messages')
    .insert({ match_id: matchId, sender_id: senderId, content: cleanContent })
    .select()
    .single();
  if (error) throw error;
  return normalizeMessage(data);
}

/** Supabase Realtime subscription for new messages in a match */
export function subscribeToMessages(matchId, onInsert) {
  if (!matchId) return () => {};

  const channel = supabase
    .channel(`messages:${matchId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
      (payload) => onInsert(normalizeMessage(payload.new))
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Reviews with reviewer profiles in one batch. */
export async function getReviewsForUserWithReviewers(userId) {
  const reviews = await getReviewsForUser(userId);
  if (!reviews.length) return { reviews, reviewers: {} };
  const reviewerIds = [...new Set(reviews.map(r => r.reviewerId))];
  const reviewers = await getUsersByIds(reviewerIds);
  return { reviews, reviewers };
}

// ─── REVIEWS ─────────────────────────────────────────────────────────────────

export async function getReviewsForUser(userId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeReview);
}

export async function getReviews() {
  const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeReview);
}

export async function addReview({ reviewerId, revieweeId, matchId, rating, comment = '', skillTaught = '' }) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({ reviewer_id: reviewerId, reviewee_id: revieweeId, match_id: matchId, rating, comment, skill_taught: skillTaught })
    .select()
    .single();
  if (error) throw error;

  return normalizeReview(data);
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export async function getNotificationsForUser(userId) {
  return cacheFetch(`notifications:${userId}`, TTL.notifications, async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) throw error;
    return (data || []).map(normalizeNotification);
  });
}

export function invalidateNotificationsCache(userId) {
  if (userId) cacheDelete(`notifications:${userId}`);
}

export async function addNotification({ userId, type, title, message, link = '/' }) {
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, type, title, message, is_read: false, link });
  if (error) console.error('Notification insert error:', error);
  else invalidateNotificationsCache(userId);
}

export async function markNotificationRead(id, userId) {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (userId) invalidateNotificationsCache(userId);
}

export async function markAllNotificationsRead(userId) {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
  invalidateNotificationsCache(userId);
}
