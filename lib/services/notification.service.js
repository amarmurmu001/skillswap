import { supabase } from '@/lib/supabase';
import { cacheFetch, cacheDelete } from '@/lib/cache';

const TTL = { notifications: 20 * 1000 };

function normalizeNotification(n) {
  return {
    id: n.id,
    userId: n.user_id,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.is_read,
    link: n.link,
    createdAt: n.created_at,
  };
}

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
