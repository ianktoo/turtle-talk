'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useMissions } from '@/app/hooks/useMissions';
import type { Mission } from '@/lib/speech/types';

const DIFFICULTY_ICON: Record<string, string> = {
  easy: '🌿',
  medium: '🐚',
  stretch: '⭐',
};

const THEME_ICON: Record<string, string> = {
  brave: '🦁',
  kind: '💛',
  calm: '🌊',
  confident: '🌟',
  creative: '🎨',
  social: '🤝',
  curious: '🔍',
};

function missionIcon(m: Mission): string {
  if (m.difficulty) return DIFFICULTY_ICON[m.difficulty] ?? '🌿';
  return THEME_ICON[m.theme] ?? '🌿';
}

export default function WorldPage() {
  const { completedMissions } = useMissions();
  const [revealed, setRevealed] = useState<string | null>(null);

  return (
    <main
      style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 20px 80px',
      }}
    >
      {/* Header */}
      <div style={{ width: '100%', maxWidth: 500, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button
            style={{
              padding: '8px 16px',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.12)',
              color: 'white',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ArrowLeft size={16} strokeWidth={2.5} /> Back
          </button>
        </Link>
        <h1
          style={{
            color: 'white',
            fontSize: '1.6rem',
            fontWeight: 900,
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            margin: 0,
          }}
        >
          My Brave Garden 🌿
        </h1>
      </div>

      {completedMissions.length === 0 ? (
        <p
          style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '1.05rem',
            textAlign: 'center',
            marginTop: 60,
            lineHeight: 1.6,
          }}
        >
          No brave acts yet!<br />Talk to Shelly and complete a mission 🐢
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 80px)',
            gap: 16,
            justifyContent: 'center',
            width: '100%',
            maxWidth: 500,
          }}
        >
          {completedMissions.map((m) => (
            <button
              key={m.id}
              onClick={() => setRevealed(revealed === m.id ? null : m.id)}
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.35)',
                background: revealed === m.id ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.14)',
                fontSize: '2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={m.title}
            >
              {missionIcon(m)}
            </button>
          ))}
        </div>
      )}

      {/* Reveal card */}
      {revealed && (() => {
        const m = completedMissions.find((x) => x.id === revealed);
        if (!m) return null;
        return (
          <div
            onClick={() => setRevealed(null)}
            style={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 40px)',
              maxWidth: 420,
              padding: '18px 20px',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(10,30,60,0.85)',
              backdropFilter: 'blur(12px)',
              color: 'white',
              cursor: 'pointer',
              zIndex: 20,
            }}
          >
            <p style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 6px' }}>{m.title}</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.85, margin: 0 }}>I did: {m.description}</p>
          </div>
        );
      })()}
    </main>
  );
}
