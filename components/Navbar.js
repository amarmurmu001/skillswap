'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import {
  HiOutlineHome,
  HiOutlineSparkles,
  HiOutlineMagnifyingGlass,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCalendarDays,
  HiOutlineBell,
  HiOutlineUserCircle,
  HiOutlineShieldCheck,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUser,
} from 'react-icons/hi2';
import { getNotificationsForUser, markAllNotificationsRead, markNotificationRead, invalidateNotificationsCache } from '@/lib/data';
import { timeAgo } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', icon: HiOutlineHome,                  label: 'Dashboard' },
  { href: '/matches',   icon: HiOutlineSparkles,              label: 'Matches'   },
  { href: '/browse',    icon: HiOutlineMagnifyingGlass,        label: 'Browse'    },
  { href: '/chat',      icon: HiOutlineChatBubbleLeftRight,    label: 'Chat'      },
  { href: '/sessions',  icon: HiOutlineCalendarDays,           label: 'Sessions'  },
];

const NOTIF_ICONS = {
  match_request: HiOutlineSparkles,
  message:       HiOutlineChatBubbleLeftRight,
  session:       HiOutlineCalendarDays,
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { on } = useSocket();
  const pathname = usePathname();
  const router   = useRouter();
  const [notifs, setNotifs]       = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser]   = useState(false);
  const notifRef = useRef(null);
  const userRef  = useRef(null);

  // Initial load
  useEffect(() => {
    if (user) getNotificationsForUser(user.id).then(setNotifs);
  }, [user?.id]);

  // Real-time: prepend new notifications as they arrive via Supabase Realtime
  useEffect(() => {
    if (!user || !on) return;
    const unsub = on('new_notification', (notif) => {
      invalidateNotificationsCache(user.id);
      setNotifs((prev) => {
        if (prev.some((n) => n.id === notif.id)) return prev;
        return [notif, ...prev];
      });
    });
    return unsub;
  }, [user?.id, on]);

  useEffect(() => {
    function clickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (userRef.current  && !userRef.current.contains(e.target))  setShowUser(false);
    }
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const unread = notifs.filter(n => !n.isRead).length;

  async function handleMarkAll() {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  async function handleNotifClick(notif) {
    await markNotificationRead(notif.id, user?.id);
    setNotifs(prev => prev.map(n => (n.id === notif.id ? { ...n, isRead: true } : n)));
    setShowNotif(false);
    router.push(notif.link || '/dashboard');
  }

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  if (!user) return null;

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(10,10,15,0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(99,102,241,0.12)',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', height: 64, gap: '0.5rem' }}>

        {/* Logo */}
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', marginRight: '1.5rem', flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#6366f1,#d946ef)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-outfit,Outfit),sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#f0f0ff', letterSpacing: '-0.01em' }}>
            Skill<span style={{ color: '#818cf8' }}>Swap</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="desktop-nav-links" style={{ display: 'flex', gap: '0.125rem', flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 0.875rem',
                  borderRadius: '0.625rem',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: active ? '#818cf8' : '#a0a0c0',
                  background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#c7d2fe'; if (!active) e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#a0a0c0'; if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right: Bell + User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>

          {/* Notifications */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowNotif(v => !v); setShowUser(false); }}
              style={{
                width: 38, height: 38,
                borderRadius: '0.625rem',
                background: showNotif ? 'rgba(99,102,241,0.12)' : 'transparent',
                border: '1px solid transparent',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                transition: 'all 0.2s',
                color: '#a0a0c0',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.color = '#c7d2fe'; }}
              onMouseLeave={e => { if (!showNotif) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a0a0c0'; } }}
            >
              <HiOutlineBell size={20} />
              {unread > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 8, height: 8,
                  background: '#d946ef',
                  borderRadius: '50%',
                  border: '1.5px solid #0a0a0f',
                }} />
              )}
            </button>

            {showNotif && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 360,
                background: '#111118',
                border: '1px solid rgba(99,102,241,0.18)',
                borderRadius: '1rem',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                zIndex: 200,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(99,102,241,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {unread > 0 && (
                      <span style={{ background: '#6366f1', color: '#fff', borderRadius: 9999, padding: '0 8px', fontSize: '0.7rem', fontWeight: 700 }}>{unread}</span>
                    )}
                    {unread > 0 && (
                      <button onClick={handleMarkAll} style={{ fontSize: '0.75rem', color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {notifs.length === 0 ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                      No notifications yet
                    </div>
                  ) : notifs.map(n => {
                    const NIcon = NOTIF_ICONS[n.type] || HiOutlineBell;
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        style={{
                          padding: '0.875rem 1.25rem',
                          borderBottom: '1px solid rgba(99,102,241,0.06)',
                          cursor: 'pointer',
                          background: n.isRead ? 'transparent' : 'rgba(99,102,241,0.04)',
                          display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(99,102,241,0.04)'}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <NIcon size={15} color="#818cf8" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.84rem', marginBottom: 2 }}>{n.title}</div>
                          <div style={{ color: '#a0a0c0', fontSize: '0.78rem', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
                          <div style={{ color: '#6366f1', fontSize: '0.7rem', marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
                        </div>
                        {!n.isRead && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d946ef', flexShrink: 0, marginTop: 6 }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div ref={userRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowUser(v => !v); setShowNotif(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.375rem 0.75rem 0.375rem 0.375rem',
                borderRadius: '2rem',
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.18)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.14)'}
              onMouseLeave={e => { if (!showUser) e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
            >
              <img src={user.avatar} alt={user.name} style={{ width: 26, height: 26, borderRadius: '50%', background: '#1a1a27' }} />
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f0f0ff', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name?.split(' ')[0]}
              </span>
            </button>

            {showUser && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 210,
                background: '#111118',
                border: '1px solid rgba(99,102,241,0.18)',
                borderRadius: '1rem',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                zIndex: 200,
              }}>
                <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{user.name}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: 2 }}>{user.email}</div>
                </div>

                {[
                  { href: '/profile',  Icon: HiOutlineUser,         label: 'My Profile'   },
                  { href: '/sessions', Icon: HiOutlineCalendarDays,  label: 'My Sessions'  },
                  ...(user.isAdmin ? [{ href: '/admin', Icon: HiOutlineShieldCheck, label: 'Admin Panel' }] : []),
                ].map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowUser(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.7rem 1rem', textDecoration: 'none', color: '#c7d2fe', fontSize: '0.875rem', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <item.Icon size={16} />
                    {item.label}
                  </Link>
                ))}

                <button
                  onClick={handleLogout}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.7rem 1rem', background: 'none', border: 'none', borderTop: '1px solid rgba(99,102,241,0.1)', cursor: 'pointer', color: '#f87171', fontSize: '0.875rem', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <HiOutlineArrowRightOnRectangle size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
