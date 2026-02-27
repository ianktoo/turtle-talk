'use client';

import type { Message } from '@/lib/speech/types';
import type { ConversationState } from '@/app/hooks/useSpeechConversation';

interface Props {
  messages: Message[];
  state: ConversationState;
}

export default function ConversationSubtitles({ messages, state }: Props) {
  // Get the last 2 messages (most recent exchange)
  const lastTwo = messages.slice(-2);
  const isProcessing = state === 'processing';
  const isEmpty = messages.length === 0 && !isProcessing;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 480,
        minHeight: 90,
        background: 'rgba(0,0,0,0.28)',
        backdropFilter: 'blur(12px)',
        borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.15)',
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {isEmpty ? (
        <p
          style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: 15,
            margin: 0,
            fontStyle: 'italic',
            textAlign: 'center',
            paddingTop: 8,
          }}
        >
          Say something to Shelly! 🐢
        </p>
      ) : (
        <>
          {lastTwo.map((msg, i) => {
            const isShelly = msg.role === 'assistant';
            return (
              <div
                key={i}
                style={{
                  animation: 'subtitleFade 0.35s ease-out both',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: isShelly ? '#fcd34d' : '#67e8f9',
                    marginRight: 6,
                  }}
                >
                  {isShelly ? 'Shelly:' : 'You:'}
                </span>
                <span
                  style={{
                    fontSize: 15,
                    color: 'rgba(255,255,255,0.92)',
                    lineHeight: 1.5,
                  }}
                >
                  {msg.content}
                </span>
              </div>
            );
          })}
          {isProcessing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#fcd34d',
                  marginRight: 6,
                }}
              >
                Shelly:
              </span>
              {[0, 1, 2].map((j) => (
                <span
                  key={j}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.7)',
                    display: 'inline-block',
                    animation: `typingDot 1.2s ease-in-out infinite`,
                    animationDelay: `${j * 0.2}s`,
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
