import { supabase } from '@/lib/supabase';
import { sanitizeText } from '@/lib/sanitize';
import { assertRateLimit } from '@/lib/rateLimit';

function normalizeMessage(m) {
  return {
    id: m.id,
    matchId: m.match_id,
    senderId: m.sender_id,
    content: m.content,
    createdAt: m.created_at,
  };
}

export async function getMessagesByMatch(matchId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at');
  if (error) throw error;
  return (data || []).map(normalizeMessage);
}

export async function sendMessage(matchId, senderId, content) {
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
  return () => { supabase.removeChannel(channel); };
}

export async function getLastMessagesForMatches(matchIds) {
  if (!matchIds?.length) return {};
  const { data, error } = await supabase
    .from('messages')
    .select('id, match_id, sender_id, content, created_at')
    .in('match_id', matchIds)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const last = {};
  for (const row of data || []) {
    if (!last[row.match_id]) last[row.match_id] = normalizeMessage(row);
  }
  return last;
}
