import { supabase } from '@/lib/supabase';

function normalizeSession(s) {
  return {
    id: s.id,
    matchId: s.match_id,
    hostId: s.host_id,
    topic: s.topic,
    scheduledAt: s.scheduled_at,
    duration: s.duration,
    meetingLink: s.meeting_link,
    status: s.status,
  };
}

export async function getSessionsForUser(userId) {
  const { data: matchRows, error: matchErr } = await supabase
    .from('matches')
    .select('id')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);
  if (matchErr) throw matchErr;
  const matchIds = (matchRows || []).map(m => m.id);
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
  if (updates.status !== undefined) sbUpdates.status = updates.status;
  if (updates.scheduledAt !== undefined) sbUpdates.scheduled_at = updates.scheduledAt;
  if (updates.topic !== undefined) sbUpdates.topic = updates.topic;
  if (updates.duration !== undefined) sbUpdates.duration = updates.duration;
  const { error } = await supabase.from('sessions').update(sbUpdates).eq('id', id);
  if (error) throw error;
}

export async function getChatConversations(userId) {
  const { getMatchesForUser } = await import('./match.service');
  const { getUsersByIds } = await import('./profile.service');
  const { getLastMessagesForMatches } = await import('./message.service');

  const matches = (await getMatchesForUser(userId)).filter(m => m.status === 'active');
  if (!matches.length) return [];

  const otherIds = matches.map(m => (m.userAId === userId ? m.userBId : m.userAId));
  const matchIds = matches.map(m => m.id);

  const [usersMap, lastByMatch] = await Promise.all([
    getUsersByIds(otherIds),
    getLastMessagesForMatches(matchIds),
  ]);

  return matches
    .map(m => {
      const otherId = m.userAId === userId ? m.userBId : m.userAId;
      return { match: m, other: usersMap[otherId] || null, lastMsg: lastByMatch[m.id] || null };
    })
    .sort((a, b) => {
      const ta = a.lastMsg ? new Date(a.lastMsg.createdAt) : new Date(a.match.createdAt);
      const tb = b.lastMsg ? new Date(b.lastMsg.createdAt) : new Date(b.match.createdAt);
      return tb - ta;
    });
}
