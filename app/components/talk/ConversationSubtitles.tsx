'use client';

import type { Message } from '@/lib/speech/types';
import type { VoiceSessionState } from '@/lib/speech/voice/types';

interface Props {
  messages: Message[];
  state: VoiceSessionState;
}

export default function ConversationSubtitles({ messages, state }: Props) {
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const lastUser      = [...messages].reverse().find((m) => m.role === 'user');
  const isProcessing  = state === 'processing';
  const isEmpty       = messages.length === 0 && !isProcessing;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 440,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        padding: '0 4px',
        minHeight: 110,
      }}
    >
      {isEmpty ? (
        <p
          style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '1.15rem',
            fontWeight: 600,
            margin: 0,
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          Say something to Shelly! 🐢
        </p>
      ) : (
        <>
          {/* Shelly's line — dominant, large */}
          {(lastAssistant || isProcessing) && (
            <div style={{ textAlign: 'center', animation: 'subtitleFade 0.3s ease-out both' }}>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#fcd34d',
                  marginBottom: 4,
                }}
              >
                Shelly
              </span>

              {isProcessing ? (
                /* Typing indicator */
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingTop: 4 }}>
                  {[0, 1, 2].map((j) => (
                    <span
                      key={j}
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.75)',
                        display: 'inline-block',
                        animation: 'typingDot 1.2s ease-in-out infinite',
                        animationDelay: `${j * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    fontSize: 'clamp(1.2rem, 4.5vw, 1.5rem)',
                    fontWeight: 700,
                    color: 'white',
                    lineHeight: 1.45,
                    margin: 0,
                    textShadow: '0 2px 12px rgba(0,0,0,0.45)',
                  }}
                >
                  {lastAssistant!.content}
                </p>
              )}
            </div>
          )}

          {/* User's line — smaller, dimmer */}
          {lastUser && (
            <div style={{ textAlign: 'center', animation: 'subtitleFade 0.3s ease-out both' }}>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#67e8f9',
                  marginBottom: 3,
                }}
              >
                You
              </span>
              <p
                style={{
                  fontSize: 'clamp(0.95rem, 3.5vw, 1.1rem)',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.4,
                  margin: 0,
                }}
              >
                {lastUser.content}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
