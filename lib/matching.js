// lib/matching.js
// Core bidirectional matching algorithm.

import { getUsers, getSkillsByIds } from './data';

/**
 * Score a pair of users:
 *   +1 for each skill currentUser offers that other wants
 *   +1 for each skill other offers that currentUser wants
 *
 * Perfect match = both sides gain simultaneously.
 */
export function scorePair(currentUser, otherUser) {
  const iCanTeachThem = (currentUser.skillsOffered || []).filter(s =>
    (otherUser.skillsWanted || []).includes(s)
  );
  const theyCanTeachMe = (otherUser.skillsOffered || []).filter(s =>
    (currentUser.skillsWanted || []).includes(s)
  );

  const score     = iCanTeachThem.length + theyCanTeachMe.length;
  const isPerfect = iCanTeachThem.length > 0 && theyCanTeachMe.length > 0;

  return { score, isPerfect, iCanTeachThem, theyCanTeachMe };
}

/**
 * Find all potential matches for a given user.
 * Returns results sorted by score (perfect matches first).
 */
export function findMatches(currentUser, allUsers) {
  return allUsers
    .filter(other => other.id !== currentUser.id)
    .map(other => {
      const { score, isPerfect, iCanTeachThem, theyCanTeachMe } = scorePair(currentUser, other);
      return { user: other, score, isPerfect, iCanTeachThem, theyCanTeachMe };
    })
    .filter(m => m.score > 0)
    .sort((a, b) => {
      // Perfect matches first, then by score
      if (b.isPerfect !== a.isPerfect) return b.isPerfect ? 1 : -1;
      return b.score - a.score;
    });
}

/**
 * Enrich match results with full skill objects.
 */
export function enrichMatches(matches) {
  return matches.map(m => ({
    ...m,
    iCanTeachThemSkills:  getSkillsByIds(m.iCanTeachThem),
    theyCanTeachMeSkills: getSkillsByIds(m.theyCanTeachMe),
  }));
}

/**
 * Full match pipeline: find + enrich.
 */
export function getMatchSuggestions(currentUser) {
  const allUsers = getUsers();
  const raw      = findMatches(currentUser, allUsers);
  return enrichMatches(raw);
}

/**
 * Browse mode: return all users sorted by rough compatibility
 * even when there is no bidirectional match.
 */
export function browseUsers(currentUser) {
  const allUsers = getUsers().filter(u => u.id !== currentUser.id);
  return allUsers
    .map(other => {
      const { score, isPerfect, iCanTeachThem, theyCanTeachMe } = scorePair(currentUser, other);
      return { user: other, score, isPerfect, iCanTeachThem, theyCanTeachMe };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Calculate match percentage (0-100) for UI display.
 */
export function matchPercent(score) {
  const maxScore = 6; // practical ceiling
  return Math.min(Math.round((score / maxScore) * 100), 100);
}
