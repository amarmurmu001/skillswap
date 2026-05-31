'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';

export default function AppLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
  }, [user, loading, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user && loading) {
        setStuck(true);
        router.replace('/auth/login');
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [user, loading, router]);

  useEffect(() => {
    if (user) setStuck(false);
  }, [user]);

  if (loading || !user) {
    return (
      <div role="status" aria-label="Loading" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner" />
        <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>Loading your dashboard…</span>
        {stuck && <p style={{ color: '#a0a0c0', fontSize: '0.875rem' }}>Taking longer than expected. <a href="/auth/login" style={{ color: '#818cf8' }}>Go to login</a></p>}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <a href="#app-main-content" style={{ position: 'absolute', top: '-100px', left: '8px', zIndex: 9999, padding: '8px 16px', background: '#6366f1', color: '#fff', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }} onFocus={e => e.currentTarget.style.top = '8px'} onBlur={e => e.currentTarget.style.top = '-100px'}>
        Skip to main content
      </a>
      <Navbar />
      <main id="app-main-content" tabIndex={-1} style={{ minHeight: 'calc(100vh - 64px)', paddingBottom: 'env(safe-area-inset-bottom, 0)' }} className="app-main">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}

