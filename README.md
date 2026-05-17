# SkillSwap 🔁⚡
> **The barter economy for knowledge** — connect, teach, learn, grow. All for free.

![SkillSwap Banner](https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=400&fit=crop)

---

## 🎯 What is SkillSwap?
SkillSwap is a **peer-to-peer skill exchange platform** where users list what they can teach and what they want to learn. Our bidirectional matching algorithm automatically pairs users where **both sides give and get value** — no money, no middlemen.

---

## 🚀 Features

| Feature | Status |
|---------|--------|
| User registration & profile (photo, bio, skills) | ✅ |
| Bidirectional skill matching algorithm | ✅ |
| Match request system (send / accept / reject) | ✅ |
| Real-time in-app chat | ✅ |
| Session scheduler with Jitsi video link | ✅ |
| Rating & review system | ✅ |
| In-app notification system | ✅ |
| Browse mode (partial matches) | ✅ |
| Admin dashboard (ban/flag users) | ✅ |
| Free video calls via Jitsi Meet | ✅ |

---

## 🏗️ Architecture

```
skillswap/
├── app/
│   ├── layout.js               # Root layout + providers
│   ├── page.js                 # Landing page
│   ├── globals.css             # Design system
│   ├── auth/
│   │   ├── login/page.js       # Login page
│   │   └── register/page.js    # 3-step registration
│   └── (app)/                  # Protected routes (auth guard)
│       ├── layout.js
│       ├── dashboard/page.js   # Dashboard
│       ├── matches/page.js     # Match suggestions + management
│       ├── browse/page.js      # Browse all users
│       ├── chat/page.js        # Real-time chat
│       ├── sessions/page.js    # Session scheduler
│       ├── profile/
│       │   ├── page.js         # Own profile (editable)
│       │   └── [id]/page.js    # Public user profile
│       └── admin/page.js       # Admin dashboard
│
├── components/
│   ├── Navbar.js               # Sticky nav with notifications
│   ├── MatchCard.js            # Match card with score ring
│   ├── SkillTag.js             # Category-colored skill pill
│   ├── ChatBox.js              # Real-time chat component
│   └── StarRating.js           # Interactive star rating
│
├── context/
│   ├── AuthContext.js          # Auth state + helpers
│   └── SocketContext.js        # Real-time socket simulation
│
├── lib/
│   ├── data.js                 # Data layer + localStorage CRUD
│   ├── matching.js             # Matching algorithm
│   ├── auth.js                 # Auth helpers
│   └── utils.js                # Formatters + color tokens
│
└── package.json
```

---

## 🧠 The Matching Algorithm

This is the **core unique feature** — often asked about in viva exams:

```js
function findMatches(currentUser, allUsers) {
  return allUsers
    .filter(other => other.id !== currentUser.id)
    .map(other => {
      // What I can teach them
      const iCanTeachThem = currentUser.skillsOffered
        .filter(s => other.skillsWanted.includes(s));

      // What they can teach me
      const theyCanTeachMe = other.skillsOffered
        .filter(s => currentUser.skillsWanted.includes(s));

      const score     = iCanTeachThem.length + theyCanTeachMe.length;
      const isPerfect = iCanTeachThem.length > 0 && theyCanTeachMe.length > 0;

      return { user: other, score, isPerfect, iCanTeachThem, theyCanTeachMe };
    })
    .filter(m => m.score > 0)
    .sort((a, b) => {
      if (b.isPerfect !== a.isPerfect) return b.isPerfect ? 1 : -1;
      return b.score - a.score; // Best matches first
    });
}
```

**Why it's equitable:** Perfect matches (both sides gain) appear at the top. Partial matches (one-directional) appear below in "Browse mode".

---

## 💾 Data Model

| Table | Key columns |
|-------|-------------|
| users | id, name, email, password, bio, avatar_url, location, skillsOffered[], skillsWanted[], rating |
| skills | id, name, category |
| matches | id, userAId, userBId, status (pending/active/completed/rejected), score, isPerfect |
| messages | id, matchId, senderId, content, createdAt |
| sessions | id, matchId, scheduledAt, duration, topic, meetingLink, status |
| reviews | id, reviewerId, revieweeId, matchId, rating, comment |
| notifications | id, userId, type, title, message, isRead, link |

---

## 🛠️ Tech Stack (100% Free)

| Layer | Tool | Why |
|-------|------|-----|
| Frontend | Next.js 14 + Tailwind CSS | App Router, RSC, great DX |
| State | React Context + localStorage | No backend needed for demo |
| Real-time | localStorage events (→ Socket.io in prod) | Cross-tab real-time simulation |
| Video | Jitsi Meet API | 100% free, no account needed |
| Hosting | Vercel | Free tier |

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Open in browser
http://localhost:3000

# Demo credentials (auto-filled on login page)
Email:    arjun@example.com
Password: password123
```

---

## 🎥 Video Calling

Sessions automatically generate a **Jitsi Meet link**:
```
https://meet.jit.si/skillswap-{matchId}
```
No API key needed. Completely free HD video calling.

---

## 📅 8-Week Timeline

| Week | Feature |
|------|---------|
| 1 | Auth + User Registration |
| 2 | Skills DB + Profile skill tagging |
| 3 | Matching algorithm + Match list UI |
| 4 | Match request system |
| 5 | Real-time chat |
| 6 | Session scheduler + Jitsi |
| 7 | Rating & review + notifications |
| 8 | Polish + testing + deployment |

---

## 👥 Team

Built as a college project demonstrating:
- **Bidirectional matching algorithms**
- **Real-time web applications**
- **Community-driven platform design**
- **Zero-cost full-stack architecture**

---

*"The best way to learn is to teach"* — SkillSwap makes both happen at once.
