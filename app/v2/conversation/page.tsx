'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MenuButton from '@/app/v2/components/MenuButton';
import { useChildSession } from '@/app/hooks/useChildSession';
import { usePersonalMemory } from '@/app/hooks/usePersonalMemory';
import { getDeviceId } from '@/lib/db';
import type { Message } from '@/lib/speech/types';

export default function V2ConversationPage() {
  const { child } = useChildSession();
  const guestChildId = typeof window !== 'undefined' ? getDeviceId() : 'default';
  const { messages: localMessages } = usePersonalMemory(guestChildId);

  const [apiMessages, setApiMessages] = useState<Message[]>([]);
  const [apiLoading, setApiLoading] = useState(true);

  const isLoggedIn = !!child;
  const messages = isLoggedIn ? apiMessages : localMessages;
  const isLoading = isLoggedIn ? apiLoading : false;

  useEffect(() => {
    if (!child) {
      setApiLoading(false);
      return;
    }
    let cancelled = false;
    setApiLoading(true);
    fetch('/api/child-memory', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.messages) setApiMessages(data.messages);
      })
      .catch(() => {
        if (!cancelled) setApiMessages([]);
      })
      .finally(() => {
        if (!cancelled) setApiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [child?.childId]);

  return (
    <>
      <MenuButton />

      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 'max(24px, env(safe-area-inset-top)) 24px max(120px, calc(24px + env(safe-area-inset-bottom)))',
          maxWidth: 500,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            width: '100%',
            flex: 1,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'var(--v2-text-primary)',
              textAlign: 'center',
            }}
          >
            Conversation with Shelly
          </h1>

          {isLoading ? (
            <p style={{ color: 'var(--v2-text-muted)', fontSize: '0.95rem' }}>Loading…</p>
          ) : messages.length === 0 ? (
            <div
              style={{
                width: '100%',
                padding: '24px 20px',
                borderRadius: 'var(--v2-radius-card)',
                background: 'var(--v2-glass)',
                border: '1px solid var(--v2-glass-border)',
                boxShadow: 'var(--v2-shadow-card)',
              }}
            >
              <p
                style={{
                  color: 'var(--v2-text-secondary)',
                  fontSize: '1rem',
                  textAlign: 'center',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                No conversations yet. Talk with Shelly to see your conversation here.
              </p>
            </div>
          ) : (
            <div
              className="v2-talk-bubbles-scroll"
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                maxHeight: '50vh',
                overflowY: 'auto',
                padding: '4px 0',
              }}
            >
              {messages.map((item, i) => {
                const isUser = item.role === 'user';
                const bubbleStyle = {
                  alignSelf: isUser ? ('flex-end' as const) : ('flex-start' as const),
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: 16,
                  background: isUser ? 'var(--v2-bubble-user-bg)' : 'var(--v2-glass-strong)',
                  border: isUser ? 'none' : '1px solid var(--v2-glass-border)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: isUser ? 'var(--v2-primary)' : 'var(--v2-text-primary)',
                  lineHeight: 1.4,
                  wordBreak: 'break-word' as const,
                  textShadow: isUser ? 'none' : '0 1px 1px rgba(255,255,255,0.3)',
                };
                return (
                  <div key={`${i}-${item.content.slice(0, 30)}`} style={bubbleStyle}>
                    {item.content}
                  </div>
                );
              })}
            </div>
          )}

          <Link
            href="/talk"
            style={{
              display: 'inline-block',
              marginTop: 8,
              padding: '14px 28px',
              borderRadius: 'var(--v2-radius-pill)',
              background: 'var(--v2-primary)',
              border: 'none',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: 'var(--v2-shadow-card)',
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
            Talk with Shelly
          </Link>
        </div>
      </main>
    </>
  );
}
