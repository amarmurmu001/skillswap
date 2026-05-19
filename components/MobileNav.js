'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  HiOutlineHome,
  HiOutlineSparkles,
  HiOutlineMagnifyingGlass,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCalendarDays,
} from 'react-icons/hi2';

const NAV_ITEMS = [
  { href: '/dashboard', icon: HiOutlineHome,               label: 'Home'    },
  { href: '/matches',   icon: HiOutlineSparkles,           label: 'Matches' },
  { href: '/browse',    icon: HiOutlineMagnifyingGlass,    label: 'Browse'  },
  { href: '/chat',      icon: HiOutlineChatBubbleLeftRight, label: 'Chat'   },
  { href: '/sessions',  icon: HiOutlineCalendarDays,       label: 'Sessions'},
];

/**
 * MobileNav — fixed bottom navigation bar, visible only on screens ≤ 768px.
 * Complements the top Navbar which is better suited to desktop widths.
 */
export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav style={{
      display: 'none',
    }} className="mobile-nav">
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        height: '100%',
        maxWidth: 480,
        margin: '0 auto',
      }}>
        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                textDecoration: 'none',
                color: active ? '#818cf8' : '#6b7280',
                transition: 'color 0.2s',
                paddingBottom: 'env(safe-area-inset-bottom, 0)',
              }}
            >
              <Icon size={22} />
              <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{item.label}</span>
              {active && (
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 24, height: 2, background: 'linear-gradient(90deg,#6366f1,#d946ef)', borderRadius: 9999 }} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
