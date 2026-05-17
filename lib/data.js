// lib/data.js
// In-memory data store that mirrors localStorage for SSR safety.
// All mutations go through these helpers so client-side state stays in sync.

import { v4 as uuidv4 } from 'uuid';

// ─── Seed data ────────────────────────────────────────────────────────────────
export const SEED_SKILLS = [
  // Tech
  { id: 's1', name: 'JavaScript', category: 'Tech' },
  { id: 's2', name: 'Python', category: 'Tech' },
  { id: 's3', name: 'React', category: 'Tech' },
  { id: 's4', name: 'Node.js', category: 'Tech' },
  { id: 's5', name: 'Machine Learning', category: 'Tech' },
  { id: 's6', name: 'UI/UX Design', category: 'Tech' },
  { id: 's7', name: 'Docker', category: 'Tech' },
  { id: 's8', name: 'GraphQL', category: 'Tech' },
  // Music
  { id: 's9',  name: 'Guitar', category: 'Music' },
  { id: 's10', name: 'Piano', category: 'Music' },
  { id: 's11', name: 'Music Production', category: 'Music' },
  { id: 's12', name: 'Singing', category: 'Music' },
  // Language
  { id: 's13', name: 'Spanish', category: 'Language' },
  { id: 's14', name: 'French', category: 'Language' },
  { id: 's15', name: 'Japanese', category: 'Language' },
  { id: 's16', name: 'Hindi', category: 'Language' },
  { id: 's17', name: 'German', category: 'Language' },
  // Art & Design
  { id: 's18', name: 'Photography', category: 'Art' },
  { id: 's19', name: 'Illustration', category: 'Art' },
  { id: 's20', name: 'Video Editing', category: 'Art' },
  // Fitness
  { id: 's21', name: 'Yoga', category: 'Fitness' },
  { id: 's22', name: 'Cooking', category: 'Lifestyle' },
  { id: 's23', name: 'Chess', category: 'Games' },
  { id: 's24', name: 'Public Speaking', category: 'Professional' },
];

export const SEED_USERS = [
  {
    id: 'u1',
    name: 'Arjun Mehta',
    email: 'arjun@example.com',
    password: 'password123',
    bio: 'Full-stack developer by day, musician by night. Love sharing knowledge and learning new creative skills.',
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Arjun',
    location: 'Mumbai, India',
    skillsOffered: ['s1', 's3', 's4'],
    skillsWanted:  ['s9', 's13', 's18'],
    rating: 4.8,
    totalReviews: 12,
    joinedAt: '2024-01-15',
    isOnline: true,
  },
  {
    id: 'u2',
    name: 'Sofia Reyes',
    email: 'sofia@example.com',
    password: 'password123',
    bio: 'Guitarist and language enthusiast. I can teach Spanish, French and guitar. Looking to improve my tech skills!',
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Sofia',
    location: 'Barcelona, Spain',
    skillsOffered: ['s9', 's13', 's14'],
    skillsWanted:  ['s3', 's6', 's20'],
    rating: 4.6,
    totalReviews: 8,
    joinedAt: '2024-02-20',
    isOnline: false,
  },
  {
    id: 'u3',
    name: 'Kenji Tanaka',
    email: 'kenji@example.com',
    password: 'password123',
    bio: 'ML researcher passionate about education. Happy to teach Python and ML. Eager to learn music production!',
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Kenji',
    location: 'Tokyo, Japan',
    skillsOffered: ['s2', 's5', 's15'],
    skillsWanted:  ['s11', 's9', 's1'],
    rating: 4.9,
    totalReviews: 21,
    joinedAt: '2024-01-05',
    isOnline: true,
  },
  {
    id: 'u4',
    name: 'Amara Osei',
    email: 'amara@example.com',
    password: 'password123',
    bio: 'Photographer and video editor. Looking to pick up coding skills. Can teach visual storytelling!',
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Amara',
    location: 'Accra, Ghana',
    skillsOffered: ['s18', 's19', 's20'],
    skillsWanted:  ['s2', 's6', 's1'],
    rating: 4.5,
    totalReviews: 6,
    joinedAt: '2024-03-10',
    isOnline: false,
  },
  {
    id: 'u5',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    password: 'password123',
    bio: 'UI/UX designer with 5 years experience. Yoga enthusiast. Want to learn programming and Japanese!',
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Priya',
    location: 'Bengaluru, India',
    skillsOffered: ['s6', 's21', 's22'],
    skillsWanted:  ['s3', 's15', 's8'],
    rating: 4.7,
    totalReviews: 15,
    joinedAt: '2024-01-28',
    isOnline: true,
  },
  {
    id: 'u6',
    name: 'Luca Ferrari',
    email: 'luca@example.com',
    password: 'password123',
    bio: 'Music producer and pianist. Looking for programming mentors to build my own music app!',
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Luca',
    location: 'Milan, Italy',
    skillsOffered: ['s11', 's10', 's12'],
    skillsWanted:  ['s2', 's4', 's7'],
    rating: 4.4,
    totalReviews: 9,
    joinedAt: '2024-02-14',
    isOnline: false,
  },
];

export const SEED_MATCHES = [
  {
    id: 'm1',
    userAId: 'u1',
    userBId: 'u2',
    status: 'active',
    createdAt: '2024-04-01',
    score: 3,
    isPerfect: true,
  },
  {
    id: 'm2',
    userAId: 'u1',
    userBId: 'u3',
    status: 'pending',
    createdAt: '2024-04-05',
    score: 2,
    isPerfect: true,
  },
];

export const SEED_MESSAGES = [
  {
    id: 'msg1',
    matchId: 'm1',
    senderId: 'u1',
    content: 'Hey Sofia! Excited to swap skills with you 🎸',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'msg2',
    matchId: 'm1',
    senderId: 'u2',
    content: 'Same here Arjun! When should we start? I was thinking we could do 2 sessions per week.',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'msg3',
    matchId: 'm1',
    senderId: 'u1',
    content: 'That sounds perfect! How about Monday and Thursday evenings? I can start teaching you React basics first.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'msg4',
    matchId: 'm1',
    senderId: 'u2',
    content: 'Monday and Thursday works! And I can teach you Spanish on Wednesdays 🎉',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const SEED_SESSIONS = [
  {
    id: 'ses1',
    matchId: 'm1',
    scheduledAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    duration: 60,
    topic: 'React Fundamentals — Components & Props',
    meetingLink: 'https://meet.jit.si/skillswap-m1-ses1',
    hostId: 'u1',
    status: 'upcoming',
  },
];

export const SEED_REVIEWS = [
  {
    id: 'rev1',
    reviewerId: 'u2',
    revieweeId: 'u1',
    matchId: 'm1',
    rating: 5,
    comment: 'Arjun is an amazing teacher. He made React so easy to understand. Highly recommend!',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    skillTaught: 'React',
  },
];

export const SEED_NOTIFICATIONS = [
  {
    id: 'n1',
    userId: 'u1',
    type: 'match_request',
    title: 'New Match Request',
    message: 'Kenji Tanaka wants to swap skills with you!',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    link: '/matches',
  },
  {
    id: 'n2',
    userId: 'u1',
    type: 'message',
    title: 'New Message',
    message: 'Sofia Reyes: Monday and Thursday works!...',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    link: '/chat/m1',
  },
  {
    id: 'n3',
    userId: 'u1',
    type: 'session',
    title: 'Session Tomorrow',
    message: 'Your session "React Fundamentals" with Sofia is tomorrow!',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    link: '/sessions',
  },
];

// ─── LocalStorage helpers (client-only) ──────────────────────────────────────
const isClient = typeof window !== 'undefined';

function getStore(key, fallback) {
  if (!isClient) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStore(key, value) {
  if (!isClient) return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Initialize store with seed data ─────────────────────────────────────────
export function initStore() {
  if (!isClient) return;
  if (!localStorage.getItem('ss_initialized')) {
    setStore('ss_users',         SEED_USERS);
    setStore('ss_skills',        SEED_SKILLS);
    setStore('ss_matches',       SEED_MATCHES);
    setStore('ss_messages',      SEED_MESSAGES);
    setStore('ss_sessions',      SEED_SESSIONS);
    setStore('ss_reviews',       SEED_REVIEWS);
    setStore('ss_notifications', SEED_NOTIFICATIONS);
    setStore('ss_initialized',   true);
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────
export function getUsers()             { return getStore('ss_users', SEED_USERS); }
export function getUserById(id)        { return getUsers().find(u => u.id === id) || null; }
export function getUserByEmail(email)  { return getUsers().find(u => u.email === email) || null; }

export function createUser(data) {
  const users = getUsers();
  const newUser = {
    id: uuidv4(),
    name: data.name,
    email: data.email,
    password: data.password,
    bio: data.bio || '',
    avatar: `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
    location: data.location || '',
    skillsOffered: data.skillsOffered || [],
    skillsWanted:  data.skillsWanted  || [],
    rating: 0,
    totalReviews: 0,
    joinedAt: new Date().toISOString().split('T')[0],
    isOnline: true,
  };
  setStore('ss_users', [...users, newUser]);
  return newUser;
}

export function updateUser(id, updates) {
  const users = getUsers().map(u => (u.id === id ? { ...u, ...updates } : u));
  setStore('ss_users', users);
  return users.find(u => u.id === id);
}

// ─── Skills ───────────────────────────────────────────────────────────────────
export function getSkills()            { return getStore('ss_skills', SEED_SKILLS); }
export function getSkillById(id)       { return getSkills().find(s => s.id === id) || null; }
export function getSkillsByIds(ids)    { return getSkills().filter(s => ids.includes(s.id)); }

// ─── Matches ──────────────────────────────────────────────────────────────────
export function getMatches()           { return getStore('ss_matches', SEED_MATCHES); }

export function getMatchesForUser(userId) {
  return getMatches().filter(
    m => m.userAId === userId || m.userBId === userId
  );
}

export function getMatchById(id)       { return getMatches().find(m => m.id === id) || null; }

export function createMatchRequest(userAId, userBId, score, isPerfect) {
  const matches = getMatches();
  // check duplicate
  const exists = matches.find(
    m =>
      (m.userAId === userAId && m.userBId === userBId) ||
      (m.userAId === userBId && m.userBId === userAId)
  );
  if (exists) return exists;

  const match = {
    id: uuidv4(),
    userAId,
    userBId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    score,
    isPerfect,
  };
  setStore('ss_matches', [...matches, match]);
  return match;
}

export function updateMatchStatus(matchId, status) {
  const matches = getMatches().map(m => (m.id === matchId ? { ...m, status } : m));
  setStore('ss_matches', matches);
}

// ─── Messages ─────────────────────────────────────────────────────────────────
export function getMessages()          { return getStore('ss_messages', SEED_MESSAGES); }
export function getMessagesByMatch(matchId) {
  return getMessages().filter(m => m.matchId === matchId).sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
}

export function addMessage(matchId, senderId, content) {
  const messages = getMessages();
  const msg = {
    id: uuidv4(),
    matchId,
    senderId,
    content,
    createdAt: new Date().toISOString(),
  };
  setStore('ss_messages', [...messages, msg]);
  return msg;
}

// ─── Sessions ─────────────────────────────────────────────────────────────────
export function getSessions()          { return getStore('ss_sessions', SEED_SESSIONS); }
export function getSessionsByMatch(matchId) {
  return getSessions().filter(s => s.matchId === matchId);
}
export function getSessionsForUser(userId) {
  const matchIds = getMatchesForUser(userId).map(m => m.id);
  return getSessions().filter(s => matchIds.includes(s.matchId));
}

export function createSession(data) {
  const sessions = getSessions();
  const session = {
    id: uuidv4(),
    matchId: data.matchId,
    scheduledAt: data.scheduledAt,
    duration: data.duration || 60,
    topic: data.topic || 'Skill Session',
    meetingLink: `https://meet.jit.si/skillswap-${data.matchId}-${Date.now()}`,
    hostId: data.hostId,
    status: 'upcoming',
  };
  setStore('ss_sessions', [...sessions, session]);
  return session;
}

export function updateSession(id, updates) {
  const sessions = getSessions().map(s => (s.id === id ? { ...s, ...updates } : s));
  setStore('ss_sessions', sessions);
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
export function getReviews()           { return getStore('ss_reviews', SEED_REVIEWS); }
export function getReviewsForUser(userId) {
  return getReviews().filter(r => r.revieweeId === userId);
}

export function addReview(data) {
  const reviews = getReviews();
  const review = {
    id: uuidv4(),
    reviewerId: data.reviewerId,
    revieweeId: data.revieweeId,
    matchId: data.matchId,
    rating: data.rating,
    comment: data.comment || '',
    createdAt: new Date().toISOString(),
    skillTaught: data.skillTaught || '',
  };
  setStore('ss_reviews', [...reviews, review]);

  // Recalculate target user's average rating
  const allReviews = [...reviews, review].filter(r => r.revieweeId === data.revieweeId);
  const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  updateUser(data.revieweeId, { rating: Math.round(avg * 10) / 10, totalReviews: allReviews.length });

  return review;
}

// ─── Notifications ────────────────────────────────────────────────────────────
export function getNotifications()     { return getStore('ss_notifications', SEED_NOTIFICATIONS); }
export function getNotificationsForUser(userId) {
  return getNotifications().filter(n => n.userId === userId).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

export function markNotificationRead(id) {
  const notifs = getNotifications().map(n => (n.id === id ? { ...n, isRead: true } : n));
  setStore('ss_notifications', notifs);
}

export function markAllNotificationsRead(userId) {
  const notifs = getNotifications().map(n =>
    n.userId === userId ? { ...n, isRead: true } : n
  );
  setStore('ss_notifications', notifs);
}

export function addNotification(data) {
  const notifs = getNotifications();
  const notif = {
    id: uuidv4(),
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    isRead: false,
    createdAt: new Date().toISOString(),
    link: data.link || '/',
  };
  setStore('ss_notifications', [notif, ...notifs]);
  return notif;
}
