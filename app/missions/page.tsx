'use client';

import { useState } from 'react';
import { Zap, CheckCircle2 } from 'lucide-react';
import { useMissions } from '@/app/hooks/useMissions';
import { useChildSession } from '@/app/hooks/useChildSession';
import BottomNav from '@/app/components/BottomNav';
import { MissionCard } from '@/app/components/missions/MissionCard';

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
          color: 'var(--tt-text-secondary)',
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
          color: 'var(--tt-text-muted)',
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
  const { child } = useChildSession();
  const { activeMissions, completedMissions, completeMission, deleteMission } = useMissions(child?.childId);
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
        padding: '24px 16px 120px',
      }}
    >
      {/* Header */}
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 28,
        }}
      >
        <h1
          style={{
            color: 'var(--tt-text-primary)',
            fontSize: 26,
            fontWeight: 800,
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            margin: 0,
            textAlign: 'center',
          }}
        >
          🐢 My Missions
        </h1>
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
                color: tab === t ? 'var(--tt-text-primary)' : 'var(--tt-text-muted)',
                padding: '10px 24px',
                fontSize: 15,
                fontWeight: tab === t ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {t === 'active' ? <><Zap size={14} strokeWidth={2.5} /> Active</> : <><CheckCircle2 size={14} strokeWidth={2.5} /> Completed</>}
              {count > 0 && (
                <span
                  style={{
                    background: tab === t ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                    borderRadius: 20,
                    padding: '1px 8px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--tt-text-primary)',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Section tile */}
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          marginBottom: 16,
          padding: '12px 20px',
          borderRadius: 14,
          background: 'rgba(0,0,0,0.25)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <h2
          style={{
            color: 'var(--tt-text-primary)',
            fontSize: 18,
            fontWeight: 700,
            margin: 0,
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        >
          {tab === 'active' ? "Today's Missions" : 'Completed'}
        </h2>
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
              onDelete={deleteMission}
            />
          ))
        )}
      </div>

      <BottomNav />
    </main>
  );
}
