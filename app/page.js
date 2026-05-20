'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getStats } from '@/lib/data';
import {
  HiOutlineSparkles,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCalendarDays,
  HiOutlineStar,
  HiOutlineVideoCamera,
  HiOutlineGlobeAlt,
} from 'react-icons/hi2';

// ─── Design system ────────────────────────────────────────────────────────────
// All tokens, utilities, and component classes live here so the JSX stays
// clean and the system is easy to audit in one place.
const DS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  /* ── Tokens ──────────────────────────────────────────────────────── */
  .lp {
    /* Surface */
    --c-bg:          #08080e;
    --c-surface:     #0f0f17;
    --c-surface-2:   #15151f;
    --c-overlay:     #1c1c28;

    /* Border */
    --c-border:      rgba(255,255,255,0.07);
    --c-border-md:   rgba(255,255,255,0.12);
    --c-border-glow: rgba(100,103,243,0.3);

    /* Brand */
    --c-indigo-300: #a5b4fc;
    --c-indigo-400: #818cf8;
    --c-indigo-500: #6366f1;
    --c-indigo-600: #4f46e5;
    --c-violet-400: #c084fc;
    --c-violet-500: #a855f7;

    /* Text */
    --c-text-1: #eeeeff;
    --c-text-2: #8585a8;
    --c-text-3: #50506a;
    --c-text-accent: #818cf8;

    /* Spacing — 4px base */
    --s-1: 4px;
    --s-2: 8px;
    --s-3: 12px;
    --s-4: 16px;
    --s-5: 24px;
    --s-6: 32px;
    --s-7: 48px;
    --s-8: 64px;
    --s-9: 96px;

    /* Radius */
    --r-sm:   6px;
    --r-md:  10px;
    --r-lg:  16px;
    --r-xl:  24px;
    --r-pill: 9999px;

    /* Transitions */
    --ease: cubic-bezier(0.4,0,0.2,1);
    --t-fast: 140ms var(--ease);
    --t-base: 240ms var(--ease);

    /* Fonts */
    --f-display: 'Plus Jakarta Sans', sans-serif;
    --f-body:    'DM Sans', sans-serif;
  }

  /* ── Base ────────────────────────────────────────────────────────── */
  .lp, .lp * { box-sizing: border-box; margin: 0; padding: 0; }
  .lp {
    font-family: var(--f-body);
    background: var(--c-bg);
    color: var(--c-text-1);
    line-height: 1.6;
    min-height: 100vh;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Grid backdrop ───────────────────────────────────────────────── */
  .lp__grid {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px);
    background-size: 56px 56px;
    mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, #000 30%, transparent 100%);
  }
  .lp__body { position: relative; z-index: 1; }

  /* ── Layout primitives ───────────────────────────────────────────── */
  .wrap     { width: 100%; max-width: 1120px; margin: 0 auto; padding: 0 var(--s-5); }
  .wrap--md { max-width: 780px;  margin: 0 auto; padding: 0 var(--s-5); }
  .wrap--sm { max-width: 620px;  margin: 0 auto; padding: 0 var(--s-5); }

  /* ── Typography ──────────────────────────────────────────────────── */
  .t-display {
    font-family: var(--f-display);
    font-size: clamp(2.5rem, 6.5vw, 4.75rem);
    font-weight: 800;
    line-height: 1.07;
    letter-spacing: -0.03em;
    color: var(--c-text-1);
  }
  .t-h2 {
    font-family: var(--f-display);
    font-size: clamp(1.6rem, 3.5vw, 2.4rem);
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.025em;
  }
  .t-h3 {
    font-family: var(--f-display);
    font-size: 1.0rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.3;
  }
  .t-body { font-size: 1rem; line-height: 1.72; color: var(--c-text-2); }
  .t-sm   { font-size: 0.875rem; line-height: 1.65; color: var(--c-text-2); }
  .t-xs   { font-size: 0.78rem; line-height: 1.5; color: var(--c-text-3); }

  .t-accent  { color: var(--c-text-accent); }
  .t-muted   { color: var(--c-text-2); }
  .t-subdued { color: var(--c-text-3); }
  .t-center  { text-align: center; }

  .t-gradient {
    background: linear-gradient(130deg, var(--c-indigo-400) 0%, var(--c-violet-400) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── Buttons ─────────────────────────────────────────────────────── */
  .btn {
    display: inline-flex; align-items: center; gap: var(--s-2);
    font-family: var(--f-display); font-weight: 600; font-size: 0.875rem;
    border-radius: var(--r-pill); cursor: pointer;
    text-decoration: none; border: none; outline: none;
    white-space: nowrap; transition: all var(--t-base);
    padding: 0.65rem 1.4rem;
  }
  .btn:focus-visible { outline: 2px solid var(--c-indigo-400); outline-offset: 3px; }
  .btn--primary {
    background: var(--c-indigo-500);
    color: #fff;
    box-shadow: 0 1px 2px rgba(0,0,0,0.3);
  }
  .btn--primary:hover {
    background: var(--c-indigo-600);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(99,102,241,0.35);
  }
  .btn--primary:active { transform: none; box-shadow: none; }

  .btn--ghost {
    background: transparent;
    color: var(--c-text-2);
    border: 1px solid var(--c-border-md);
  }
  .btn--ghost:hover {
    background: var(--c-surface);
    color: var(--c-text-1);
    border-color: rgba(255,255,255,0.18);
  }
  .btn--lg { padding: 0.85rem 1.9rem; font-size: 0.95rem; }

  /* ── Nav ──────────────────────────────────────────────────────────── */
  .nav {
    position: sticky; top: 0; z-index: 100;
    border-bottom: 1px solid var(--c-border);
    background: rgba(8,8,14,0.82);
    backdrop-filter: blur(20px) saturate(160%);
    -webkit-backdrop-filter: blur(20px) saturate(160%);
  }
  .nav__inner {
    height: 58px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .nav__logo {
    display: flex; align-items: center; gap: var(--s-2);
    text-decoration: none;
  }
  .nav__mark {
    width: 30px; height: 30px; border-radius: var(--r-sm); flex-shrink: 0;
    background: linear-gradient(135deg, var(--c-indigo-500), var(--c-violet-500));
    display: flex; align-items: center; justify-content: center;
  }
  .nav__wordmark {
    font-family: var(--f-display); font-weight: 800; font-size: 1.1rem;
    color: var(--c-text-1);
  }
  .nav__wordmark span { color: var(--c-indigo-400); }
  .nav__actions { display: flex; align-items: center; gap: var(--s-2); }

  /* ── Hero ─────────────────────────────────────────────────────────── */
  .hero {
    padding: calc(var(--s-9) + var(--s-4)) 0 var(--s-9);
    text-align: center;
    position: relative;
  }
  .hero::after {
    content: '';
    position: absolute; top: -80px; left: 50%; transform: translateX(-50%);
    width: 640px; height: 560px;
    background: radial-gradient(ellipse at top, rgba(99,102,241,0.1) 0%, transparent 65%);
    pointer-events: none;
  }
  .hero__eyebrow {
    display: inline-flex; align-items: center; gap: var(--s-2);
    background: rgba(99,102,241,0.08);
    border: 1px solid rgba(99,102,241,0.22);
    border-radius: var(--r-pill);
    padding: 0.3rem 0.9rem;
    font-size: 0.78rem; font-weight: 600;
    color: var(--c-indigo-300);
    letter-spacing: 0.015em;
    margin-bottom: var(--s-6);
  }
  .hero__eyebrow-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--c-indigo-400); flex-shrink: 0;
    box-shadow: 0 0 6px var(--c-indigo-400);
  }
  .hero__hl  { margin-bottom: var(--s-5); }
  .hero__sub { max-width: 500px; margin: 0 auto var(--s-7); }
  .hero__cta { display: flex; gap: var(--s-3); justify-content: center; flex-wrap: wrap; }

  /* ── Stats strip ──────────────────────────────────────────────────── */
  .stats-strip {
    border-top: 1px solid var(--c-border);
    border-bottom: 1px solid var(--c-border);
    background: var(--c-surface);
  }
  .stats-strip__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }
  .stat-cell {
    padding: var(--s-6) var(--s-5);
    text-align: center;
    border-right: 1px solid var(--c-border);
  }
  .stat-cell:last-child { border-right: none; }
  .stat-cell__value {
    font-family: var(--f-display);
    font-size: clamp(1.65rem, 3vw, 2.2rem);
    font-weight: 800;
    letter-spacing: -0.035em;
    line-height: 1;
    margin-bottom: var(--s-2);
    background: linear-gradient(130deg, var(--c-indigo-400), var(--c-violet-400));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .stat-cell__label {
    font-size: 0.78rem; font-weight: 500;
    color: var(--c-text-3);
    letter-spacing: 0.025em;
    text-transform: uppercase;
  }

  /* ── Section wrapper ──────────────────────────────────────────────── */
  .section { padding: var(--s-9) 0; }
  .section__hd { text-align: center; margin-bottom: var(--s-8); }
  .section__kicker {
    display: inline-block;
    font-size: 0.7rem; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--c-indigo-400);
    margin-bottom: var(--s-3);
  }
  .section__title { margin-bottom: var(--s-3); }
  .section__sub { max-width: 440px; margin: 0 auto; }

  /* ── Feature grid ─────────────────────────────────────────────────── */
  .feat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    background: var(--c-border);
    border: 1px solid var(--c-border);
    border-radius: var(--r-xl);
    overflow: hidden;
    gap: 1px;
  }
  .feat-card {
    background: var(--c-bg);
    padding: var(--s-7) var(--s-6);
    transition: background var(--t-base);
  }
  .feat-card:hover { background: var(--c-surface); }
  .feat-card__icon {
    width: 42px; height: 42px;
    border-radius: var(--r-md);
    background: rgba(99,102,241,0.07);
    border: 1px solid rgba(99,102,241,0.15);
    display: flex; align-items: center; justify-content: center;
    color: var(--c-indigo-400);
    margin-bottom: var(--s-5);
    transition: all var(--t-base);
  }
  .feat-card:hover .feat-card__icon {
    background: rgba(99,102,241,0.14);
    border-color: rgba(99,102,241,0.32);
    box-shadow: 0 0 18px rgba(99,102,241,0.14);
  }
  .feat-card__title { margin-bottom: var(--s-2); }
  .feat-card__body  { font-size: 0.86rem; color: var(--c-text-2); line-height: 1.65; }

  /* ── Steps ────────────────────────────────────────────────────────── */
  .steps-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--s-5);
    position: relative;
  }
  .steps-grid::before {
    content: '';
    position: absolute;
    top: 25px;
    left: calc(12.5% + 26px);
    right: calc(12.5% + 26px);
    height: 1px;
    background: linear-gradient(90deg,
      transparent,
      var(--c-border-glow) 20%,
      var(--c-border-glow) 80%,
      transparent
    );
  }
  .step { text-align: center; padding: 0 var(--s-3); }
  .step__num {
    width: 50px; height: 50px; border-radius: 50%;
    background: var(--c-surface);
    border: 1px solid var(--c-border-md);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto var(--s-5);
    font-family: var(--f-display);
    font-size: 0.8rem; font-weight: 700;
    color: var(--c-text-3);
    position: relative; z-index: 1;
    transition: all var(--t-base);
  }
  .step:hover .step__num {
    border-color: var(--c-border-glow);
    color: var(--c-indigo-400);
    background: rgba(99,102,241,0.06);
  }
  .step__title { margin-bottom: var(--s-2); }
  .step__desc  { font-size: 0.84rem; color: var(--c-text-2); line-height: 1.6; }

  /* ── CTA card ─────────────────────────────────────────────────────── */
  .cta-section { padding: var(--s-9) 0; }
  .cta-card {
    background: var(--c-surface);
    border: 1px solid var(--c-border-md);
    border-radius: var(--r-xl);
    padding: var(--s-9) var(--s-6);
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .cta-card::before {
    content: '';
    position: absolute; top: 0; left: 50%; transform: translateX(-50%);
    width: 380px; height: 180px;
    background: radial-gradient(ellipse at top,
      rgba(99,102,241,0.12) 0%, transparent 70%
    );
    pointer-events: none;
  }
  .cta-card__title { margin-bottom: var(--s-4); }
  .cta-card__sub   { max-width: 400px; margin: 0 auto var(--s-7); }

  /* ── Footer ───────────────────────────────────────────────────────── */
  .footer {
    padding: var(--s-6) 0;
    border-top: 1px solid var(--c-border);
  }
  .footer__inner {
    display: flex; align-items: center;
    justify-content: space-between; flex-wrap: wrap; gap: var(--s-4);
  }
  .footer__brand {
    font-family: var(--f-display); font-weight: 700; font-size: 0.9rem;
    color: var(--c-text-accent);
  }
  .footer__links { display: flex; gap: var(--s-5); }
  .footer__link {
    font-size: 0.8rem; color: var(--c-text-3);
    text-decoration: none; transition: color var(--t-fast);
  }
  .footer__link:hover { color: var(--c-text-2); }
  .footer__copy { font-size: 0.78rem; color: var(--c-text-3); }

  /* ── Responsive: tablet ≤ 900px ───────────────────────────────────── */
  @media (max-width: 900px) {
    .feat-grid   { grid-template-columns: repeat(2, 1fr); }
    .steps-grid  { grid-template-columns: repeat(2, 1fr); }
    .steps-grid::before { display: none; }
    .stats-strip__grid { grid-template-columns: repeat(2, 1fr); }
    .stat-cell { border-bottom: 1px solid var(--c-border); }
    .stat-cell:nth-child(2n) { border-right: none; }
    .stat-cell:nth-last-child(-n+2):not(:nth-child(2n+1)),
    .stat-cell:last-child { border-bottom: none; }
  }

  /* ── Responsive: mobile ≤ 580px ───────────────────────────────────── */
  @media (max-width: 580px) {
    .lp { --s-9: 64px; --s-8: 48px; --s-7: 36px; }

    .hero { padding: var(--s-8) 0 var(--s-7); }
    .hero::after { width: 280px; height: 280px; }

    .feat-grid   { grid-template-columns: 1fr; border-radius: var(--r-lg); }
    .steps-grid  { grid-template-columns: 1fr; gap: var(--s-6); }

    .stats-strip__grid { grid-template-columns: repeat(2, 1fr); }
    .stat-cell:nth-child(2):last-child,
    .stat-cell:nth-child(4) { border-bottom: none; }

    .cta-card { padding: var(--s-7) var(--s-5); }

    .nav__wordmark .hide-xs { display: none; }

    .footer__inner { flex-direction: column; align-items: flex-start; gap: var(--s-3); }
    .footer__links { flex-wrap: wrap; }

    .btn--lg { padding: 0.8rem 1.6rem; font-size: 0.9rem; }
  }
`;

// ─── Static data ──────────────────────────────────────────────────────────────
const FEATURES = [
  { Icon: HiOutlineSparkles,            title: 'Smart matching',    desc: 'Bidirectional algorithm pairs users where both sides can teach and learn simultaneously — perfect matches ranked first.' },
  { Icon: HiOutlineChatBubbleLeftRight, title: 'Real-time chat',    desc: 'Supabase Realtime keeps messages in sync across devices. No page refresh, no lag.' },
  { Icon: HiOutlineCalendarDays,        title: 'Session scheduler', desc: 'Book sessions in-app. Every confirmed booking auto-generates a Jitsi video link.' },
  { Icon: HiOutlineStar,                title: 'Rating system',     desc: 'Post-session reviews build reputation over time so the best teachers rise to the top.' },
  { Icon: HiOutlineVideoCamera,         title: 'Free video calls',  desc: 'Integrated Jitsi Meet — 100 % free HD video calling, no account or download needed.' },
  { Icon: HiOutlineGlobeAlt,            title: 'Global community',  desc: 'Connect with skill enthusiasts anywhere. Geography is no longer a barrier to learning.' },
];

const STEPS = [
  { step: '01', title: 'Create profile',  desc: 'List the skills you can teach and the ones you want to learn.' },
  { step: '02', title: 'Get matched',     desc: 'Our algorithm surfaces your best-fit partners automatically.' },
  { step: '03', title: 'Connect & chat',  desc: 'Send a request, talk it through, and pick a time.' },
  { step: '04', title: 'Swap & grow',     desc: 'Exchange knowledge over video and leave honest reviews.' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtStat(n) {
  if (n == null) return '…';
  if (n <= 0)    return '—';
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k+` : `${n}+`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [liveStats, setLiveStats] = useState(null);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    getStats().then(setLiveStats).catch(() => {});
  }, []);

  if (loading) return null;

  const STATS = [
    { value: fmtStat(liveStats?.swaps),   label: 'Skill swaps'  },
    { value: fmtStat(liveStats?.members), label: 'Members'      },
    { value: '200+',                       label: 'Skills listed' },
    {
      value: liveStats
        ? (liveStats.avgRating ? `${liveStats.avgRating}★` : '—')
        : '…',
      label: 'Avg rating',
    },
  ];

  return (
    <>
      {/* Inject design system */}
      <style dangerouslySetInnerHTML={{ __html: DS }} />

      <div className="lp">
        {/* Decorative grid backdrop */}
        <div className="lp__grid" aria-hidden="true" />

        <div className="lp__body">

          {/* ── Navigation ───────────────────────────────────────────── */}
          <header className="nav">
            <div className="wrap">
              <div className="nav__inner">

                <Link href="/" className="nav__logo">
                  <div className="nav__mark" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <span className="nav__wordmark">
                    Skill<span>Swap</span>
                  </span>
                </Link>

                <nav className="nav__actions" aria-label="Site navigation">
                  <Link href="/auth/login"    className="btn btn--ghost">Sign in</Link>
                  <Link href="/auth/register" className="btn btn--primary">Get started</Link>
                </nav>

              </div>
            </div>
          </header>

          {/* ── Hero ─────────────────────────────────────────────────── */}
          <section className="hero" aria-labelledby="hero-headline">
            <div className="wrap--sm">

              <div className="hero__eyebrow">
                <span className="hero__eyebrow-dot" aria-hidden="true" />
                The barter economy for knowledge
              </div>

              <h1 id="hero-headline" className="t-display hero__hl">
                Teach what you know.{' '}
                <span className="t-gradient">Learn what you want.</span>
              </h1>

              <p className="t-body hero__sub">
                SkillSwap connects people who exchange skills for free — no money,
                no middlemen, just real human connections and mutual growth.
              </p>

              <div className="hero__cta">
                <Link href="/auth/register" className="btn btn--primary btn--lg">
                  Get started free
                </Link>
                <Link href="/auth/login" className="btn btn--ghost btn--lg">
                  Sign in
                </Link>
              </div>

            </div>
          </section>

          {/* ── Stats strip ──────────────────────────────────────────── */}
          <div className="stats-strip" role="region" aria-label="Platform statistics">
            <div className="wrap">
              <div className="stats-strip__grid">
                {STATS.map(s => (
                  <div key={s.label} className="stat-cell">
                    <div className="stat-cell__value">{s.value}</div>
                    <div className="stat-cell__label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Features ─────────────────────────────────────────────── */}
          <section className="section" aria-labelledby="features-title">
            <div className="wrap">
              <div className="section__hd">
                <span className="section__kicker">Platform features</span>
                <h2 id="features-title" className="t-h2 section__title">
                  Everything you need to{' '}
                  <span className="t-gradient">swap skills</span>
                </h2>
                <p className="t-sm section__sub">
                  Matching, real-time chat, video calls, and scheduling — all in one
                  place, all for free.
                </p>
              </div>

              <div className="feat-grid">
                {FEATURES.map(f => (
                  <article key={f.title} className="feat-card">
                    <div className="feat-card__icon" aria-hidden="true">
                      <f.Icon size={20} />
                    </div>
                    <h3 className="t-h3 feat-card__title">{f.title}</h3>
                    <p className="feat-card__body">{f.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* ── How it works ─────────────────────────────────────────── */}
          <section className="section" style={{ paddingTop: 0 }} aria-labelledby="how-title">
            <div className="wrap--md">
              <div className="section__hd">
                <span className="section__kicker">How it works</span>
                <h2 id="how-title" className="t-h2 section__title">
                  Four steps to your first swap
                </h2>
              </div>

              <ol className="steps-grid" style={{ listStyle: 'none' }}>
                {STEPS.map(s => (
                  <li key={s.step} className="step">
                    <div className="step__num" aria-hidden="true">{s.step}</div>
                    <h3 className="t-h3 step__title">{s.title}</h3>
                    <p className="step__desc">{s.desc}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ── CTA ──────────────────────────────────────────────────── */}
          <section className="cta-section" aria-labelledby="cta-title">
            <div className="wrap--md">
              <div className="cta-card">
                <h2 id="cta-title" className="t-h2 cta-card__title">
                  Ready to start swapping?
                </h2>
                <p className="t-body cta-card__sub">
                  Join thousands of learners and teachers already exchanging
                  skills for free.
                </p>
                <Link href="/auth/register" className="btn btn--primary btn--lg">
                  Join SkillSwap — it&apos;s free
                </Link>
              </div>
            </div>
          </section>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <footer className="footer">
            <div className="wrap">
              <div className="footer__inner">
                <span className="footer__brand">SkillSwap</span>
                <nav className="footer__links" aria-label="Footer links">
                  <a href="#" className="footer__link">About</a>
                  <a href="#" className="footer__link">Privacy</a>
                  <a href="#" className="footer__link">Terms</a>
                </nav>
                <span className="footer__copy">© 2025 SkillSwap · Free forever</span>
              </div>
            </div>
          </footer>

        </div>
      </div>
    </>
  );
}