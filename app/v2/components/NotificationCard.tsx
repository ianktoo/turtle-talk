'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export interface NotificationCardProps {
  id: string;
  from: string;
  text: string;
  emoji?: string;
}

export default function NotificationCard({ id, from, text, emoji }: NotificationCardProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="article"
      style={{
        background: 'var(--v2-glass)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--v2-glass-border)',
        borderRadius: 'var(--v2-radius-card)',
        boxShadow: 'var(--v2-shadow-card)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        position: 'relative',
        animation: 'v2-card-enter 0.3s var(--v2-transition-spring)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--v2-text-secondary)',
            lineHeight: 1.3,
          }}
        >
          {from}
        </p>
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: '1.0625rem',
            fontWeight: 700,
            color: 'var(--v2-text-primary)',
            lineHeight: 1.35,
            textShadow: '0 1px 1px rgba(255,255,255,0.4)',
          }}
        >
          {text}
        </p>
      </div>
      {emoji && (
        <span style={{ fontSize: '1.5rem', flexShrink: 0 }} aria-hidden>
          {emoji}
        </span>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          border: 'none',
          background: 'transparent',
          color: 'var(--v2-text-muted)',
          cursor: 'pointer',
          transition: 'color var(--v2-transition-fast), background var(--v2-transition-fast)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.06)';
          e.currentTarget.style.color = 'var(--v2-text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--v2-text-muted)';
        }}
      >
        <X size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
