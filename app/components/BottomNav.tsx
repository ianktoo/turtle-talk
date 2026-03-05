'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, Star, Mic } from 'lucide-react';

const LEFT_ITEM  = { href: '/world',    icon: Leaf, label: 'My Garden',   color: '#06b6d4' };
const RIGHT_ITEM = { href: '/missions', icon: Star, label: 'My Missions', color: '#f97316' };

function NavItem({ href, icon: Icon, label, color, active }: {
  href: string; icon: typeof Leaf; label: string; color: string; active: boolean;
}) {
  return (
    <Link href={href} aria-label={label} style={{ textDecoration: 'none', flex: 1, display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          minHeight: 44,
          padding: '8px 12px',
          opacity: active ? 1 : 0.6,
          transition: 'opacity 0.15s',
        }}
      >
        <Icon size={22} color={active ? color : 'var(--tt-text-primary)'} strokeWidth={active ? 2.5 : 1.75} aria-hidden />
        <span
          className="nav-item-label"
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: active ? color : 'var(--tt-text-secondary)',
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
      className="bottom-nav"
      style={{
        position: 'fixed',
        bottom: 'max(16px, env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 24px)',
        maxWidth: 500,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px max(14px, env(safe-area-inset-bottom))',
        borderRadius: 32,
        background: 'rgba(8, 22, 48, 0.88)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      }}
    >
      <NavItem {...LEFT_ITEM}  active={pathname === LEFT_ITEM.href}  />

      {/* Centre pill — Talk to Shelly (voice chat, not a call) */}
      <Link
        href="/talk"
        style={{
          textDecoration: 'none',
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            minHeight: 44,
            padding: '10px 20px',
            borderRadius: 9999,
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            boxShadow: '0 4px 20px rgba(22,163,74,0.5)',
            border: '2px solid rgba(255,255,255,0.25)',
            flexShrink: 0,
            transition: 'transform 0.15s, opacity 0.15s',
          }}
          className="active:scale-[0.98] active:opacity-90"
        >
          <Mic size={22} color="white" strokeWidth={2} />
          <span
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: 'var(--tt-text-primary)',
              whiteSpace: 'nowrap',
            }}
          >
            Talk to Shelly
          </span>
        </div>
      </Link>

      <NavItem {...RIGHT_ITEM} active={pathname === RIGHT_ITEM.href} />
    </nav>
  );
}
