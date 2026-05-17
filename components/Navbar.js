'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/data';
import { timeAgo } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/matches',   icon: '✨', label: 'Matches'   },
  { href: '/browse',    icon: '🔍', label: 'Browse'    },
  { href: '/chat',      icon: '💬', label: 'Chat'      },
  { href: '/sessions',  icon: '📅', label: 'Sessions'  },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [notifs, setNotifs]     = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const notifRef = useRef(null);
  const userRef  = useRef(null);

  useEffect(() => {
    if (user) setNotifs(getNotificationsForUser(user.id));
  }, [user, pathname]);

  useEffect(() => {
    function clickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (userRef.current  && !userRef.current.contains(e.target))  setShowUser(false);
    }
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const unread = notifs.filter(n => !n.isRead).length;

  function handleMarkAll() {
    if (!user) return;
    markAllNotificationsRead(user.id);
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  function handleNotifClick(notif) {
    markNotificationRead(notif.id);
    setNotifs(prev => prev.map(n => (n.id === notif.id ? { ...n, isRead: true } : n)));
    setShowNotif(false);
    router.push(notif.link || '/dashboard');
  }

  function handleLogout() {
    logout();
    router.push('/');
  }

  if (!user) return null;

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(99,102,241,0.12)',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', height: 64, gap: '1rem' }}>
        {/* Logo */}
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginRight: '1rem' }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg,#6366f1,#d946ef)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem',
          }}>⚡</div>
          <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#f0f0ff' }}>
            Skill<span style={{ color: '#818cf8' }}>Swap</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', gap: '0.25rem', flex: 1 }} className="hidden md:flex">
          {NAV_ITEMS.map(item => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 0.875rem',
                borderRadius: '0.75rem',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: active ? '#818cf8' : '#a0a0c0',
                background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(99,102,241,0.07)'; e.currentTarget.style.color = '#c7d2fe'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a0a0c0'; } }}
              >
                <span>{item.icon}</span>
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
          {/* Notifications */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowNotif(v => !v); setShowUser(false); }}
              style={{
                width: 40, height: 40,
                borderRadius: '50%',
                background: showNotif ? 'rgba(99,102,241,0.15)' : 'transparent',
                border: '1px solid rgba(99,102,241,0.15)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem',
                position: 'relative',
                transition: 'all 0.2s ease',
                color: '#f0f0ff',
              }}
            >
              🔔
              {unread > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 16, height: 16,
                  background: '#d946ef',
                  borderRadius: '50%',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff',
                }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {showNotif && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 340,
                background: '#111118',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '1.25rem',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                zIndex: 200,
                overflow: 'hidden',
                animation: 'fadeIn 0.2s ease',
              }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(99,102,241,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications</span>
                  {unread > 0 && (
                    <button onClick={handleMarkAll} style={{ fontSize: '0.75rem', color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {notifs.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#a0a0c0', fontSize: '0.875rem' }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifs.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        style={{
                          padding: '0.875rem 1.25rem',
                          borderBottom: '1px solid rgba(99,102,241,0.07)',
                          cursor: 'pointer',
                          background: n.isRead ? 'transparent' : 'rgba(99,102,241,0.05)',
                          display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(99,102,241,0.05)'}
                      >
                        <span style={{ fontSize: '1.25rem' }}>
                          {n.type === 'match_request' ? '✨' : n.type === 'message' ? '💬' : n.type === 'session' ? '📅' : '🔔'}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 2 }}>{n.title}</div>
                          <div style={{ color: '#a0a0c0', fontSize: '0.8rem', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.message}</div>
                          <div style={{ color: '#6366f1', fontSize: '0.72rem', marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
                        </div>
                        {!n.isRead && <div className="notif-dot" style={{ marginTop: 4, flexShrink: 0 }} />}
                      </div>
                    ))
                  )}
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
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <img
                src={user.avatar}
                alt={user.name}
                style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a1a27' }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f0f0ff', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name.split(' ')[0]}
              </span>
              <span style={{ color: '#818cf8', fontSize: '0.7rem' }}>▼</span>
            </button>

            {showUser && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 220,
                background: '#111118',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '1.25rem',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                animation: 'fadeIn 0.2s ease',
                zIndex: 200,
              }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user.name}</div>
                  <div style={{ color: '#a0a0c0', fontSize: '0.78rem', marginTop: 2 }}>{user.email}</div>
                </div>
                {[
                  { href: '/profile', icon: '👤', label: 'My Profile' },
                  { href: '/sessions', icon: '📅', label: 'My Sessions' },
                  { href: '/admin',   icon: '🛡️', label: 'Admin' },
                ].map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setShowUser(false)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    textDecoration: 'none',
                    color: '#c7d2fe',
                    fontSize: '0.875rem',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span>{item.icon}</span>{item.label}
                  </Link>
                ))}
                <button onClick={handleLogout} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#f87171', fontSize: '0.875rem',
                  borderTop: '1px solid rgba(99,102,241,0.12)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden"
            style={{
              width: 40, height: 40,
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              color: '#818cf8',
              fontSize: '1.2rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div style={{
          background: '#111118',
          borderTop: '1px solid rgba(99,102,241,0.12)',
          padding: '0.75rem 1rem',
          display: 'flex', flexDirection: 'column', gap: '0.25rem',
        }}>
          {NAV_ITEMS.map(item => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.875rem',
                textDecoration: 'none',
                color: active ? '#818cf8' : '#a0a0c0',
                background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                fontWeight: 500,
              }}>
                <span>{item.icon}</span>{item.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
