'use client';

import Link from 'next/link';
import { createElement } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface MenuItemProps {
  icon: LucideIcon | string;
  label: string;
  href: string;
  onClick?: () => void;
}

/** Lucide icons can be objects (forwardRef), not functions, so we treat non-string as component. */
function isEmojiString(icon: LucideIcon | string): icon is string {
  return typeof icon === 'string';
}

export default function MenuItem({ icon: IconOrEmoji, label, href, onClick }: MenuItemProps) {
  const iconContent = isEmojiString(IconOrEmoji) ? (
    <span style={{ fontSize: '1.25rem' }} aria-hidden>{IconOrEmoji}</span>
  ) : (
    createElement(IconOrEmoji as LucideIcon, { size: 20, strokeWidth: 2, 'aria-hidden': true })
  );
  const content = (
    <>
      <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {iconContent}
      </span>
      <span
        style={{
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--v2-text-primary)',
          textAlign: 'center',
        }}
      >
        {label}
      </span>
    </>
  );

  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 12,
        width: '100%',
        minHeight: 'var(--v2-touch-min)',
        padding: '12px 16px',
        borderRadius: 'var(--v2-radius-card)',
        textDecoration: 'none',
        transition: 'background var(--v2-transition-fast)',
      }}
      className="v2-menu-item"
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(0, 207, 185, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {content}
    </Link>
  );
}
