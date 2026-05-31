import { supabase } from '@/lib/supabase';

export async function getStats() {
  const [membersRes, swapsRes, ratingsRes] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('banned', false),
    supabase.from('matches').select('*', { count: 'exact', head: true }).in('status', ['active', 'completed']),
    supabase.from('reviews').select('rating'),
  ]);

  const members = membersRes.count ?? 0;
  const swaps = swapsRes.count ?? 0;
  const allRatings = ratingsRes.data ?? [];
  const avgRating = allRatings.length > 0
    ? (allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length).toFixed(1)
    : null;

  return { members, swaps, avgRating };
}
