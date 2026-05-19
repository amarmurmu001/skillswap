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

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [liveStats, setLiveStats] = useState(null);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  // Fetch live stats (runs even when logged out — no auth required for counts)
  useEffect(() => {
    getStats().then(setLiveStats).catch(() => {});
  }, []);

  if (loading) return null;

  const features = [
    { Icon: HiOutlineSparkles,           title: 'Smart Matching',     desc: 'Our algorithm pairs users where both sides can teach and learn simultaneously.' },
    { Icon: HiOutlineChatBubbleLeftRight, title: 'Real-time Chat',     desc: 'Instantly message your matches to plan sessions and build connections.' },
    { Icon: HiOutlineCalendarDays,        title: 'Session Scheduler',  desc: 'Book sessions directly in-app with auto-generated Jitsi video links.' },
    { Icon: HiOutlineStar,                title: 'Reputation System',  desc: 'Reviews and ratings keep the community high-quality and trustworthy.' },
    { Icon: HiOutlineVideoCamera,         title: 'Free Video Calls',   desc: 'Integrated Jitsi Meet — 100% free HD video calling, no account needed.' },
    { Icon: HiOutlineGlobeAlt,            title: 'Global Community',   desc: 'Connect with skill enthusiasts across the world for free exchanges.' },
  ];

  const stats = [
    {
      value: liveStats ? (liveStats.swaps >= 1000 ? `${(liveStats.swaps / 1000).toFixed(1)}k+` : liveStats.swaps > 0 ? `${liveStats.swaps}+` : '—') : '…',
      label: 'Skill Swaps',
    },
    {
      value: liveStats ? (liveStats.members >= 1000 ? `${(liveStats.members / 1000).toFixed(1)}k+` : liveStats.members > 0 ? `${liveStats.members}+` : '—') : '…',
      label: 'Members',
    },
    { value: '200+', label: 'Skills Listed' },
    {
      value: liveStats ? (liveStats.avgRating ? `${liveStats.avgRating}★` : '—') : '…',
      label: 'Avg Rating',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Top nav */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,15,0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(99,102,241,0.1)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#6366f1,#d946ef)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.2rem' }}>
              Skill<span style={{ color: '#818cf8' }}>Swap</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href="/auth/login" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.875rem' }}>Sign In</Link>
            <Link href="/auth/register" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.875rem' }}><span>Get Started</span></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '6rem 1.5rem 4rem', maxWidth: 900, margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 9999,
          padding: '0.4rem 1rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: '#818cf8',
          marginBottom: '1.5rem',
        }}>
          The barter economy for knowledge
        </div>

        <h1 style={{
          fontFamily: 'Outfit,sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(2.5rem, 7vw, 5rem)',
          lineHeight: 1.1,
          marginBottom: '1.5rem',
        }}>
          Teach what you know.{' '}
          <span className="gradient-text">Learn what you want.</span>
        </h1>

        <p style={{ color: '#a0a0c0', fontSize: '1.15rem', lineHeight: 1.7, maxWidth: 600, margin: '0 auto 2.5rem' }}>
          SkillSwap connects people who want to exchange skills for free. No money, no middlemen —
          just real human connections and knowledge.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/register" className="btn-primary" style={{ textDecoration: 'none', fontSize: '1rem', padding: '0.9rem 2.25rem' }}>
            <span>Get Started Free</span>
          </Link>
          <Link href="/auth/login" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '1rem', padding: '0.9rem 2.25rem' }}>
            Sign In
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section style={{ maxWidth: 900, margin: '0 auto 5rem', padding: '0 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }} className="grid-cols-2 md:grid-cols-4">
          {stats.map(s => (
            <div key={s.label} className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: '2rem', fontWeight: 800 }} className="gradient-text">{s.value}</div>
              <div style={{ color: '#a0a0c0', fontSize: '0.85rem', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1100, margin: '0 auto 5rem', padding: '0 1.5rem' }}>
        <h2 style={{ textAlign: 'center', fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 'clamp(1.75rem,4vw,2.5rem)', marginBottom: '3rem' }}>
          Everything you need to{' '}
          <span className="gradient-text">swap skills</span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {features.map(f => (
            <div key={f.title} className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <f.Icon size={20} color="#818cf8" />
              </div>
              <h3 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ color: '#a0a0c0', fontSize: '0.875rem', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: 900, margin: '0 auto 5rem', padding: '0 1.5rem' }}>
        <h2 style={{ textAlign: 'center', fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 'clamp(1.75rem,4vw,2.5rem)', marginBottom: '3rem' }}>
          How it works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {[
            { step: '01', title: 'Create Profile',  desc: 'List your skills and what you want to learn.' },
            { step: '02', title: 'Get Matched',      desc: 'Our algorithm finds your perfect skill exchange partners.' },
            { step: '03', title: 'Connect & Chat',   desc: 'Send a request, chat, and plan your sessions.' },
            { step: '04', title: 'Learn & Teach',    desc: 'Exchange skills via video call and leave reviews.' },
          ].map(step => (
            <div key={step.step} style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{
                width: 52, height: 52,
                background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(217,70,239,0.15))',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem',
                fontFamily: 'Outfit,sans-serif',
                fontWeight: 800,
                color: '#818cf8',
                fontSize: '0.9rem',
                letterSpacing: '-0.02em',
              }}>{step.step}</div>
              <h3 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, marginBottom: '0.5rem' }}>{step.title}</h3>
              <p style={{ color: '#a0a0c0', fontSize: '0.85rem', lineHeight: 1.6 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '5rem 1.5rem', maxWidth: 700, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 'clamp(1.75rem,4vw,2.5rem)', marginBottom: '1rem' }}>
          Ready to start swapping?
        </h2>
        <p style={{ color: '#a0a0c0', marginBottom: '2rem', lineHeight: 1.7 }}>
          Join thousands of learners and teachers already exchanging skills for free.
        </p>
        <Link href="/auth/register" className="btn-primary" style={{ textDecoration: 'none', fontSize: '1.05rem', padding: '1rem 2.5rem' }}>
          <span>Join SkillSwap — It's Free</span>
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(99,102,241,0.1)', padding: '2rem 1.5rem', textAlign: 'center', color: '#6b7280', fontSize: '0.85rem' }}>
        <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, color: '#818cf8' }}>SkillSwap</span>
        {' '}· The barter economy for knowledge · Free forever
      </footer>
    </div>
  );
}
