// lib/matching.js
import { getUsers, getSkillsByIds } from './data';

export function scorePair(currentUser, otherUser) {
  const iCanTeachThem  = (currentUser.skillsOffered || []).filter(s => (otherUser.skillsWanted  || []).includes(s));
  const theyCanTeachMe = (otherUser.skillsOffered   || []).filter(s => (currentUser.skillsWanted || []).includes(s));
  const score     = iCanTeachThem.length + theyCanTeachMe.length;
  const isPerfect = iCanTeachThem.length > 0 && theyCanTeachMe.length > 0;
  return { score, isPerfect, iCanTeachThem, theyCanTeachMe };
}

function rankUsers(currentUser, allUsers) {
  return allUsers
    .filter(u => u.id !== currentUser.id)
    .map(other => {
      const { score, isPerfect, iCanTeachThem, theyCanTeachMe } = scorePair(currentUser, other);
      return { user: other, score, isPerfect, iCanTeachThem, theyCanTeachMe };
    })
    .filter(m => m.score > 0)
    .sort((a, b) => {
      if (b.isPerfect !== a.isPerfect) return b.isPerfect ? 1 : -1;
      return b.score - a.score;
    });
}

/** Returns sorted perfect/partial matches (score > 0) — pass `allUsers` to skip network. */
export function getMatchSuggestionsFromList(currentUser, allUsers) {
  return rankUsers(currentUser, allUsers || []);
}

export async function getMatchSuggestions(currentUser, allUsers) {
  const list = allUsers || (await getUsers());
  return getMatchSuggestionsFromList(currentUser, list);
}

/** Returns all other users ranked by match score — pass `allUsers` to skip network. */
export function getBrowseUsersFromList(currentUser, allUsers) {
  return (allUsers || [])
    .filter(u => u.id !== currentUser.id)
    .map(other => {
      const { score, isPerfect, iCanTeachThem, theyCanTeachMe } = scorePair(currentUser, other);
      return { user: other, score, isPerfect, iCanTeachThem, theyCanTeachMe };
    })
    .sort((a, b) => b.score - a.score);
}

export async function getBrowseUsers(currentUser, allUsers) {
  const list = allUsers || (await getUsers());
  return getBrowseUsersFromList(currentUser, list);
}

/** Enrich match objects with resolved skill objects */
export async function enrichMatches(matches) {
  return Promise.all(matches.map(async m => ({
    ...m,
    iCanTeachThemSkills:  await getSkillsByIds(m.iCanTeachThem),
    theyCanTeachMeSkills: await getSkillsByIds(m.theyCanTeachMe),
  })));
}

export function matchPercent(score) {
  return Math.min(Math.round((score / 6) * 100), 100);
}
