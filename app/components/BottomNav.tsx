'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, Star, Phone } from 'lucide-react';

const LEFT_ITEM  = { href: '/world',    icon: Leaf, label: 'My Garden',   color: '#06b6d4' };
const RIGHT_ITEM = { href: '/missions', icon: Star, label: 'My Missions', color: '#f97316' };

function NavItem({ href, icon: Icon, label, color, active }: {
  href: string; icon: typeof Leaf; label: string; color: string; active: boolean;
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none', flex: 1 }}>
      {/* Explicit min-height so the touch target is generous for small fingers */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          minHeight: 56,
          opacity: active ? 1 : 0.6,
          transition: 'opacity 0.15s',
        }}
      >
        <Icon size={28} color={active ? color : 'white'} strokeWidth={active ? 2.5 : 1.75} />
        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: active ? color : 'rgba(255,255,255,0.8)',
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </div>
    </Link>
  );
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 24px)',
        maxWidth: 500,
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: '16px 20px 14px',
        borderRadius: 32,
        background: 'rgba(8, 22, 48, 0.88)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.16)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      }}
    >
      <NavItem {...LEFT_ITEM}  active={pathname === LEFT_ITEM.href}  />

      {/* Centre call button — protrudes above the bar */}
      <Link
        href="/talk"
        style={{ textDecoration: 'none', flex: 1, display: 'flex', justifyContent: 'center' }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            boxShadow: '0 6px 28px rgba(22,163,74,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: -44,   // protrudes well above the bar
            border: '4px solid rgba(255,255,255,0.22)',
            animation: 'btnPulse 3s ease-in-out infinite',
            flexShrink: 0,
          }}
        >
          <Phone size={34} color="white" strokeWidth={2} />
        </div>
      </Link>

      <NavItem {...RIGHT_ITEM} active={pathname === RIGHT_ITEM.href} />
    </nav>
  );
}
