import { supabase } from '@/lib/supabase';

function normalizeReview(r) {
  return {
    id: r.id,
    reviewerId: r.reviewer_id,
    revieweeId: r.reviewee_id,
    matchId: r.match_id,
    rating: r.rating,
    comment: r.comment,
    skillTaught: r.skill_taught,
    createdAt: r.created_at,
  };
}

export async function getReviewsForUser(userId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeReview);
}

export async function getAllReviews() {
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

export async function getReviewsForUserWithReviewers(userId) {
  const reviews = await getReviewsForUser(userId);
  if (!reviews.length) return { reviews, reviewers: {} };
  const reviewerIds = [...new Set(reviews.map(r => r.reviewerId))];
  const { getUsersByIds } = await import('./profile.service');
  const reviewers = await getUsersByIds(reviewerIds);
  return { reviews, reviewers };
}
