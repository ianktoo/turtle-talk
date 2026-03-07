'use client';

import { useEffect } from 'react';
import { Home, Leaf, Heart, MessageCircle, Mail } from 'lucide-react';
import MenuItem from './MenuItem';

const ITEMS = [
  { href: '/v2', label: 'Home', icon: Home },
  { href: '/appreciation', label: 'My Garden', icon: Leaf },
  { href: '/appreciation/wish-list', label: 'Wish List', icon: Heart },
  { href: '/v2/talk', label: 'Conversation', icon: MessageCircle },
  { href: '/messages', label: 'Messages', icon: Mail },
] as const;

export interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Menu({ isOpen, onClose }: MenuProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 320,
          background: 'var(--v2-surface)',
          borderRadius: 'var(--v2-radius-card)',
          boxShadow: 'var(--v2-shadow-menu)',
          padding: '16px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {ITEMS.map((item) => (
          <MenuItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            onClick={onClose}
          />
        ))}
      </div>
    </div>
  );
}
