'use client';

import { useEffect, useRef } from 'react';
import { Check, X, MessageCircle } from 'lucide-react';
import type { MissionSuggestion } from '@/lib/speech/types';

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  stretch: 'Stretch',
};

export interface MissionDetailModalProps {
  mission: MissionSuggestion;
  onAccept: () => void;
  onDecline: () => void;
  onDismiss: () => void;
  /** When provided, show a "Talk about this" card that opens talk focused on this mission. */
  onTalkAbout?: (mission: MissionSuggestion) => void;
}

export default function MissionDetailModal({
  mission,
  onAccept,
  onDecline,
  onDismiss,
  onTalkAbout,
}: MissionDetailModalProps) {
  const dismissRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    dismissRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  const label = DIFFICULTY_LABEL[mission.difficulty] ?? mission.difficulty;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-detail-title"
      aria-label="Mission details"
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
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'var(--v2-surface)',
          borderRadius: 'var(--v2-radius-card)',
          boxShadow: 'var(--v2-shadow-menu)',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p
          id="mission-detail-category"
          style={{
            margin: 0,
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--v2-text-muted)',
          }}
        >
          {label}
        </p>
        <h2
          id="mission-detail-title"
          style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--v2-text-primary)',
            lineHeight: 1.3,
          }}
        >
          {mission.title}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: '0.9375rem',
            color: 'var(--v2-text-secondary)',
            lineHeight: 1.5,
          }}
        >
          {mission.description}
        </p>

        {onTalkAbout && (
          <button
            type="button"
            onClick={() => onTalkAbout(mission)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              width: '100%',
              padding: '14px 20px',
              borderRadius: 'var(--v2-radius-card)',
              border: '1px solid var(--v2-primary)',
              background: 'rgba(0, 207, 185, 0.08)',
              color: 'var(--v2-primary-dark)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background var(--v2-transition-fast), transform var(--v2-transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 207, 185, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 207, 185, 0.08)';
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <MessageCircle size={20} strokeWidth={2} aria-hidden />
            Talk about this
          </button>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 4 }}>
          <button
            type="button"
            onClick={onAccept}
            aria-label="Accept mission"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--v2-primary)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform var(--v2-transition-fast)',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Check size={24} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={onDecline}
            aria-label="Decline mission"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: '2px solid var(--v2-text-muted)',
              background: 'transparent',
              color: 'var(--v2-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color var(--v2-transition-fast), color var(--v2-transition-fast), transform var(--v2-transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--v2-text-primary)';
              e.currentTarget.style.color = 'var(--v2-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--v2-text-muted)';
              e.currentTarget.style.color = 'var(--v2-text-secondary)';
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <button
          ref={dismissRef}
          type="button"
          onClick={onDismiss}
          style={{
            width: '100%',
            padding: '16px 28px',
            borderRadius: 'var(--v2-radius-pill)',
            border: 'none',
            background: 'var(--v2-text-muted)',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background var(--v2-transition-fast), transform var(--v2-transition-fast)',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
