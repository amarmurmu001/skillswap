import { supabase } from '@/lib/supabase';
import { cacheFetch, cacheDelete, cacheDeletePrefix } from '@/lib/cache';
import { assertRateLimit } from '@/lib/rateLimit';

const TTL = { matches: 30 * 1000 };

function normalizeMatch(m) {
  return {
    id: m.id,
    userAId: m.user_a_id,
    userBId: m.user_b_id,
    status: m.status,
    score: m.score || 0,
    isPerfect: m.is_perfect || false,
    createdAt: m.created_at,
  };
}

export function invalidateMatchesCache(userId) {
  if (userId) cacheDelete(`matches:${userId}`);
  cacheDeletePrefix('matches:');
}

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

export async function getMatchById(id) {
  const { data } = await supabase.from('matches').select('*').eq('id', id).single();
  return data ? normalizeMatch(data) : null;
}

export async function createMatchRequest(userAId, userBId, score, isPerfect) {
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
    m => (m.user_a_id === userAId && m.user_b_id === userBId) ||
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

export async function getAllMatchesForAdmin() {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeMatch);
}
