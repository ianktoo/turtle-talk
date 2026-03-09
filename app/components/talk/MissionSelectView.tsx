'use client';

import { X } from 'lucide-react';
import type { MissionSuggestion } from '@/lib/speech/types';

const DIFFICULTY_ICON: Record<string, string> = {
  easy: '🌿',
  medium: '🐚',
  stretch: '⭐',
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: '#22c55e',
  medium: '#f59e0b',
  stretch: '#8b5cf6',
};

interface MissionSelectViewProps {
  choices: MissionSuggestion[];
  onSelect: (choice: MissionSuggestion) => void;
  onDismiss: () => void;
}

export default function MissionSelectView({ choices, onSelect, onDismiss }: MissionSelectViewProps) {
  return (
    <main
      style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        gap: 16,
      }}
    >
      <p
        style={{
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: 800,
          textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        🐢 Choose your mission!
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 400 }}>
        {choices.map((choice) => {
          const icon = DIFFICULTY_ICON[choice.difficulty] ?? '🌿';
          const color = DIFFICULTY_COLOR[choice.difficulty] ?? '#22c55e';
          return (
            <button
              key={choice.title}
              onClick={() => onSelect(choice)}
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.14)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '2rem', flexShrink: 0 }}>{icon}</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color,
                      background: 'rgba(0,0,0,0.25)',
                      padding: '2px 8px',
                      borderRadius: 999,
                    }}
                  >
                    {choice.difficulty}
                  </span>
                  <span style={{ fontSize: '1rem', fontWeight: 700 }}>{choice.title}</span>
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 400, opacity: 0.85 }}>
                  {choice.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onDismiss}
        style={{
          marginTop: 8,
          padding: '14px 28px',
          borderRadius: 9999,
          border: 'none',
          background: 'linear-gradient(135deg, #b45309, #d97706)',
          color: 'white',
          fontSize: '1rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(217, 119, 6, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        Missions
      </button>
      <button
        onClick={onDismiss}
        style={{
          marginTop: 8,
          padding: '12px 28px',
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.3)',
          background: 'rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.85)',
          fontSize: '0.9375rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <X size={16} strokeWidth={2.5} /> Maybe later
      </button>
    </main>
  );
}
