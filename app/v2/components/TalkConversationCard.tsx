'use client';

import type { Message } from '@/lib/speech/types';
import TalkConversationBubbles from './TalkConversationBubbles';

export interface TalkConversationCardProps {
  messages: Message[];
  pendingUserTranscript?: string | null;
}

export default function TalkConversationCard({
  messages,
  pendingUserTranscript,
}: TalkConversationCardProps) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 440,
        borderRadius: 24,
        background: 'var(--v2-glass)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid var(--v2-glass-border)',
        boxShadow: 'var(--v2-shadow-card)',
        padding: '20px 24px',
      }}
    >
      <TalkConversationBubbles
        messages={messages}
        pendingUserTranscript={pendingUserTranscript}
      />
    </div>
  );
}
