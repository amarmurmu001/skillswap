'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';

export default function AppLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 64px)', paddingBottom: 'env(safe-area-inset-bottom, 0)' }} className="app-main">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}

