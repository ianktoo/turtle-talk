'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMissions } from '@/app/hooks/useMissions';
import type { Mission, MissionTheme } from '@/lib/speech/types';

const THEME_EMOJI: Record<MissionTheme, string> = {
  brave: '🦁',
  kind: '💛',
  calm: '🌊',
  confident: '⭐',
  creative: '🎨',
  social: '🤝',
  curious: '🔍',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function MissionCard({
  mission,
  onComplete,
  onDelete,
}: {
  mission: Mission;
  onComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const isActive = mission.status === 'active';
  return (
    <div
      style={{
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 16,
        padding: '16px 20px',
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        backdropFilter: 'blur(8px)',
        backgroundColor: isActive ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)',
      }}
    >
      <span style={{ fontSize: 36, lineHeight: 1, flexShrink: 0 }}>
        {THEME_EMOJI[mission.theme]}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            color: 'white',
            fontWeight: 700,
            fontSize: 17,
            margin: 0,
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        >
          {mission.title}
        </p>
        <p
          style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: 14,
            margin: '4px 0 0',
            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          {mission.description}
        </p>
        {!isActive && mission.completedAt && (
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, margin: '6px 0 0' }}>
            Completed {formatDate(mission.completedAt)}
          </p>
        )}
        {isActive && (
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '6px 0 0' }}>
            Started {formatDate(mission.createdAt)}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        {isActive && onComplete && (
          <button
            onClick={() => onComplete(mission.id)}
            style={{
              background: 'rgba(34, 197, 94, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ✓ Done!
          </button>
        )}
        {!isActive && onDelete && (
          <button
            onClick={() => onDelete(mission.id)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 10,
              padding: '6px 12px',
              fontSize: 12,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: 'active' | 'completed' }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span style={{ fontSize: 64 }}>{tab === 'active' ? '🌊' : '🏆'}</span>
      <p
        style={{
          color: 'rgba(255,255,255,0.85)',
          fontSize: 17,
          fontWeight: 600,
          textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          margin: 0,
        }}
      >
        {tab === 'active' ? 'No active missions yet!' : 'No completed missions yet.'}
      </p>
      <p
        style={{
          color: 'rgba(255,255,255,0.55)',
          fontSize: 14,
          margin: 0,
          maxWidth: 280,
        }}
      >
        {tab === 'active'
          ? 'Talk to Shelly and she might suggest a mission just for you!'
          : 'Complete an active mission and it will appear here.'}
      </p>
    </div>
  );
}

export default function MissionsPage() {
  const router = useRouter();
  const { activeMissions, completedMissions, completeMission, deleteMission } = useMissions();
  const [tab, setTab] = useState<'active' | 'completed'>('active');

  const displayed = tab === 'active' ? activeMissions : completedMissions;

  return (
    <main
      style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px 48px',
      }}
    >
      {/* Header */}
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          display: 'flex',
          alignItems: 'center',
          marginBottom: 28,
        }}
      >
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 12,
            color: 'white',
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          ← Home
        </button>
        <h1
          style={{
            color: 'white',
            fontSize: 26,
            fontWeight: 800,
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            margin: 0,
            flex: 1,
            textAlign: 'center',
          }}
        >
          🐢 My Missions
        </h1>
        {/* Spacer to balance back button */}
        <div style={{ width: 80 }} />
      </div>

      {/* Tab switcher */}
      <div
        style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.25)',
          borderRadius: 14,
          padding: 4,
          marginBottom: 24,
          gap: 4,
          backdropFilter: 'blur(8px)',
        }}
      >
        {(['active', 'completed'] as const).map((t) => {
          const count = t === 'active' ? activeMissions.length : completedMissions.length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? 'rgba(255,255,255,0.2)' : 'transparent',
                border: 'none',
                borderRadius: 10,
                color: tab === t ? 'white' : 'rgba(255,255,255,0.55)',
                padding: '10px 24px',
                fontSize: 15,
                fontWeight: tab === t ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {t === 'active' ? '⚡ Active' : '✅ Completed'}
              {count > 0 && (
                <span
                  style={{
                    background: tab === t ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                    borderRadius: 20,
                    padding: '1px 8px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'white',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mission list */}
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {displayed.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          displayed.map((m) => (
            <MissionCard
              key={m.id}
              mission={m}
              onComplete={tab === 'active' ? completeMission : undefined}
              onDelete={tab === 'completed' ? deleteMission : undefined}
            />
          ))
        )}
      </div>

      {/* Talk to Shelly CTA */}
      <button
        onClick={() => router.push('/talk')}
        style={{
          marginTop: 36,
          background: 'rgba(255,255,255,0.18)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 16,
          color: 'white',
          padding: '14px 32px',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          textShadow: '0 1px 4px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
        }}
      >
        🐢 Talk to Shelly
      </button>
    </main>
  );
}
