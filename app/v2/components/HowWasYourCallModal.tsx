'use client';

import { useEffect, useRef, useState } from 'react';

export type CallRating = 'happy' | 'neutral' | 'sad';

export interface HowWasYourCallModalProps {
  onDone: () => void;
  onSelect?: (rating: CallRating) => void;
}

const EMOJIS: { rating: CallRating; emoji: string; label: string }[] = [
  { rating: 'happy', emoji: '😊', label: 'Happy' },
  { rating: 'neutral', emoji: '😐', label: 'Neutral' },
  { rating: 'sad', emoji: '😢', label: 'Sad' },
];

export default function HowWasYourCallModal({ onDone, onSelect }: HowWasYourCallModalProps) {
  const [selected, setSelected] = useState<CallRating | null>(null);
  const doneButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    doneButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDone();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDone]);

  const handleSelect = (rating: CallRating) => {
    setSelected(rating);
    onSelect?.(rating);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-was-call-modal-title"
      aria-label="How was your call?"
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
    >
      <div
        style={{
          width: '100%',
          maxWidth: 320,
          background: 'var(--v2-surface)',
          borderRadius: 'var(--v2-radius-card)',
          boxShadow: 'var(--v2-shadow-menu)',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 24,
        }}
      >
        <p
          id="how-was-call-modal-title"
          style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--v2-text-primary)',
            textAlign: 'center',
          }}
        >
          How was your call?
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          {EMOJIS.map(({ rating, emoji, label }) => (
            <button
              key={rating}
              type="button"
              aria-label={label}
              aria-pressed={selected === rating}
              onClick={() => handleSelect(rating)}
              style={{
                width: 48,
                height: 48,
                minWidth: 48,
                minHeight: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                border: `2px solid ${selected === rating ? 'var(--v2-primary)' : 'var(--v2-text-muted)'}`,
                borderRadius: '50%',
                background: selected === rating ? 'rgba(0, 207, 185, 0.12)' : 'transparent',
                cursor: 'pointer',
                transition: 'border-color var(--v2-transition-fast), background var(--v2-transition-fast)',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>

        <button
          ref={doneButtonRef}
          type="button"
          onClick={onDone}
          style={{
            width: '100%',
            padding: '14px 24px',
            borderRadius: 'var(--v2-radius-pill)',
            border: 'none',
            background: 'var(--v2-primary)',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--v2-shadow-card)',
            transition: 'transform var(--v2-transition-fast), opacity var(--v2-transition-fast)',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Done
        </button>
      </div>
    </div>
  );
}
