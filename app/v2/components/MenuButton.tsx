'use client';

import { useState } from 'react';
import { Signpost, UserCircle } from 'lucide-react';
import { useChildSession } from '@/app/hooks/useChildSession';
import Menu from './Menu';
import ChildLoginModalV2 from './ChildLoginModalV2';

export default function MenuButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { child, refetch } = useChildSession();

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 'max(16px, env(safe-area-inset-top))',
          left: 'max(16px, env(safe-area-inset-left))',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <button
        type="button"
        aria-label="Open menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        style={{
          width: 'var(--v2-touch-min)',
          height: 'var(--v2-touch-min)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--v2-radius-card)',
          background: 'var(--v2-glass)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--v2-glass-border)',
          boxShadow: 'var(--v2-shadow-card)',
          cursor: 'pointer',
          color: 'var(--v2-text-primary)',
          transition: 'transform var(--v2-transition-fast), box-shadow var(--v2-transition-fast)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = 'var(--v2-shadow-menu)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'var(--v2-shadow-card)';
        }}
      >
        <Signpost size={24} strokeWidth={2} aria-hidden />
      </button>
      {!child && (
        <button
          type="button"
          onClick={() => setShowLoginModal(true)}
          aria-label="You're browsing as a guest — tap to log in"
          title="You're browsing as a guest. Tap to log in!"
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--v2-text-muted)',
            padding: '4px 10px',
            borderRadius: '9999px',
            background: 'var(--v2-glass)',
            border: '1px solid var(--v2-glass-border)',
            letterSpacing: '0.02em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <UserCircle size={14} strokeWidth={2} aria-hidden />
          Guest
        </button>
      )}
      </div>
      <Menu
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onOpenLogin={() => {
          setIsOpen(false);
          setShowLoginModal(true);
        }}
      />
      <ChildLoginModalV2
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          refetch();
        }}
      />
    </>
  );
}
