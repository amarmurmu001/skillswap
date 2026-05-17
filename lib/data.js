// lib/data.js — Supabase only, no localStorage
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// ─── Normalizers (snake_case → camelCase) ────────────────────────────────────
function normalizeProfile(p) {
  return {
    id:           p.id,
    name:         p.name,
    email:        p.email || '',
    bio:          p.bio || '',
    avatar:       p.avatar_url || `https://api.dicebear.com/8.x/avataaars/svg?seed=${p.id}`,
    location:     p.location || '',
    rating:       Number(p.rating) || 0,
    totalReviews: p.total_reviews || 0,
    isOnline:     p.is_online || false,
    banned:       p.banned || false,
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

function normalizeMessage(m) {
  return {
    id:        m.id,
    matchId:   m.match_id,
    senderId:  m.sender_id,
    content:   m.content,
    createdAt: m.created_at,
  };
}

function normalizeSession(s) {
  return {
    id:          s.id,
    matchId:     s.match_id,
    hostId:      s.host_id,
    topic:       s.topic,
    scheduledAt: s.scheduled_at,
    duration:    s.duration,
    meetingLink: s.meeting_link,
    status:      s.status,
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

export async function getUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, skillsOffered:user_skills_offered(skill_id), skillsWanted:user_skills_wanted(skill_id)')
    .eq('banned', false);
  if (error) throw error;
  return (data || []).map(normalizeProfile);
}

export async function getUserById(id) {
  if (!id) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*, skillsOffered:user_skills_offered(skill_id), skillsWanted:user_skills_wanted(skill_id)')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return normalizeProfile(data);
}

export async function getUserByEmail(email) {
  // Note: profiles table doesn't store email (that's in auth.users).
  // This is only used for lookup via Supabase Admin — not needed in production.
  return null;
}

export async function updateUser(id, updates) {
  const sbUpdates = {};
  if (updates.name     !== undefined) sbUpdates.name       = updates.name;
  if (updates.bio      !== undefined) sbUpdates.bio        = updates.bio;
  if (updates.location !== undefined) sbUpdates.location   = updates.location;
  if (updates.avatar   !== undefined) sbUpdates.avatar_url = updates.avatar;
  if (updates.rating   !== undefined) sbUpdates.rating     = updates.rating;
  if (updates.totalReviews !== undefined) sbUpdates.total_reviews = updates.totalReviews;
  if (updates.isOnline !== undefined) sbUpdates.is_online  = updates.isOnline;
  if (updates.banned   !== undefined) sbUpdates.banned     = updates.banned;

  if (Object.keys(sbUpdates).length) {
    const { error } = await supabase.from('profiles').update(sbUpdates).eq('id', id);
    if (error) throw error;
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
  const { data, error } = await supabase.from('skills').select('*').order('category').order('name');
  if (error) {
    console.error('getSkills error:', error.message, '— Have you run supabase/schema.sql?');
    return [];
  }
  return data || [];
}

export async function getSkillsByIds(ids) {
  if (!ids?.length) return [];
  const { data, error } = await supabase.from('skills').select('*').in('id', ids);
  if (error) throw error;
  return data || [];
}

export async function getSkillById(id) {
  const { data } = await supabase.from('skills').select('*').eq('id', id).single();
  return data || null;
}

// ─── MATCHES ─────────────────────────────────────────────────────────────────

export async function getMatchesForUser(userId) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeMatch);
}

export async function getMatchById(id) {
  const { data } = await supabase.from('matches').select('*').eq('id', id).single();
  return data ? normalizeMatch(data) : null;
}

export async function createMatchRequest(userAId, userBId, score, isPerfect) {
  // Prevent duplicates
  const { data: existing } = await supabase
    .from('matches')
    .select('*')
    .or(`and(user_a_id.eq.${userAId},user_b_id.eq.${userBId}),and(user_a_id.eq.${userBId},user_b_id.eq.${userAId})`)
    .maybeSingle();
  if (existing) return normalizeMatch(existing);

  const { data, error } = await supabase
    .from('matches')
    .insert({ user_a_id: userAId, user_b_id: userBId, status: 'pending', score, is_perfect: isPerfect })
    .select()
    .single();
  if (error) throw error;
  return normalizeMatch(data);
}

export async function updateMatchStatus(matchId, status) {
  const { error } = await supabase.from('matches').update({ status }).eq('id', matchId);
  if (error) throw error;
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
  const { data, error } = await supabase
    .from('messages')
    .insert({ match_id: matchId, sender_id: senderId, content })
    .select()
    .single();
  if (error) throw error;
  return normalizeMessage(data);
}

// ─── SESSIONS ────────────────────────────────────────────────────────────────

export async function getSessionsForUser(userId) {
  const matches = await getMatchesForUser(userId);
  const matchIds = matches.map(m => m.id);
  if (!matchIds.length) return [];

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .in('match_id', matchIds)
    .order('scheduled_at');
  if (error) throw error;
  return (data || []).map(normalizeSession);
}

export async function getSessionsByMatch(matchId) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('match_id', matchId)
    .order('scheduled_at');
  if (error) throw error;
  return (data || []).map(normalizeSession);
}

export async function createSession({ matchId, hostId, topic, scheduledAt, duration = 60 }) {
  const meetingLink = `https://meet.jit.si/skillswap-${matchId}-${Date.now()}`;
  const { data, error } = await supabase
    .from('sessions')
    .insert({ match_id: matchId, host_id: hostId, topic, scheduled_at: scheduledAt, duration, meeting_link: meetingLink, status: 'upcoming' })
    .select()
    .single();
  if (error) throw error;
  return normalizeSession(data);
}

export async function updateSession(id, updates) {
  const sbUpdates = {};
  if (updates.status      !== undefined) sbUpdates.status       = updates.status;
  if (updates.scheduledAt !== undefined) sbUpdates.scheduled_at = updates.scheduledAt;
  if (updates.topic       !== undefined) sbUpdates.topic        = updates.topic;
  if (updates.duration    !== undefined) sbUpdates.duration     = updates.duration;
  const { error } = await supabase.from('sessions').update(sbUpdates).eq('id', id);
  if (error) throw error;
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

  // Recalculate rating average
  const { data: all } = await supabase.from('reviews').select('rating').eq('reviewee_id', revieweeId);
  if (all?.length) {
    const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
    await supabase.from('profiles').update({ rating: Math.round(avg * 10) / 10, total_reviews: all.length }).eq('id', revieweeId);
  }

  return normalizeReview(data);
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export async function getNotificationsForUser(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data || []).map(normalizeNotification);
}

export async function addNotification({ userId, type, title, message, link = '/' }) {
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, type, title, message, is_read: false, link });
  if (error) console.error('Notification insert error:', error);
}

export async function markNotificationRead(id) {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
}

export async function markAllNotificationsRead(userId) {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
}
