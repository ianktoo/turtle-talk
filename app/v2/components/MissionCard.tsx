'use client';

import type { MissionSuggestion } from '@/lib/speech/types';

const DIFFICULTY_ICON: Record<string, string> = {
  easy: '🌿',
  medium: '🐚',
  stretch: '⭐',
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  stretch: 'Stretch',
};

const CARD_COLOR_VAR: Record<string, string> = {
  easy: 'var(--v2-mission-easy)',
  medium: 'var(--v2-mission-medium)',
  stretch: 'var(--v2-mission-stretch)',
};

const CARD_COLOR_SELECTED_VAR: Record<string, string> = {
  easy: 'var(--v2-mission-easy-selected)',
  medium: 'var(--v2-mission-medium-selected)',
  stretch: 'var(--v2-mission-stretch-selected)',
};

export interface MissionCardProps {
  mission: MissionSuggestion;
  isSelected: boolean;
  onSelect: () => void;
}

export default function MissionCard({ mission, isSelected, onSelect }: MissionCardProps) {
  const icon = DIFFICULTY_ICON[mission.difficulty] ?? '🌿';
  const label = DIFFICULTY_LABEL[mission.difficulty] ?? mission.difficulty;
  const bgColor = CARD_COLOR_VAR[mission.difficulty] ?? CARD_COLOR_VAR.easy;
  const bgSelected = CARD_COLOR_SELECTED_VAR[mission.difficulty] ?? CARD_COLOR_SELECTED_VAR.easy;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={isSelected ? 'v2-mission-card-selected' : undefined}
      style={{
        width: '100%',
        maxWidth: 380,
        padding: '16px 20px',
        borderRadius: 'var(--v2-radius-card)',
        border: `2px solid ${isSelected ? bgSelected : 'transparent'}`,
        background: isSelected ? bgSelected : bgColor,
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        textAlign: 'left',
        boxShadow: 'var(--v2-shadow-card)',
        transition: 'border-color var(--v2-transition-fast), background var(--v2-transition-fast), transform var(--v2-transition-fast)',
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <span style={{ fontSize: '1.75rem', flexShrink: 0 }}>{icon}</span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            opacity: 0.9,
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: '1rem', fontWeight: 700 }}>{mission.title}</span>
      </span>
      <span style={{ fontSize: '1.5rem', flexShrink: 0 }} aria-hidden="true">{icon}</span>
    </button>
  );
}
