'use client';

import type { VoiceSessionState } from '@/lib/speech/voice/types';

const ACTIVE_STATES: Set<VoiceSessionState> = new Set([
  'listening',
  'recording',
  'processing',
  'speaking',
  'muted',
]);

export interface TalkMuteToggleProps {
  isMuted: boolean;
  onToggle: () => void;
  /** Only show when call is in one of these states */
  callActive: boolean;
}

export default function TalkMuteToggle({ isMuted, onToggle, callActive }: TalkMuteToggleProps) {
  if (!callActive) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isMuted ? 'Unmute' : 'Mute'}
      style={{
        background: 'none',
        border: 'none',
        padding: '8px 12px',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: 'var(--v2-text-muted)',
        cursor: 'pointer',
        textDecoration: 'underline',
        textUnderlineOffset: 2,
        transition: 'color var(--v2-transition-fast)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--v2-text-secondary)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--v2-text-muted)')}
    >
      {isMuted ? 'unmute' : 'mute'}
    </button>
  );
}
