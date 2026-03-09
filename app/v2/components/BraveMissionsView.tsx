'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import type { MissionSuggestion } from '@/lib/speech/types';
import MenuButton from './MenuButton';
import MissionCard from './MissionCard';
import MissionDetailModal from './MissionDetailModal';

export interface BraveMissionsViewProps {
  choices: MissionSuggestion[];
  onSelectMission: (choice: MissionSuggestion) => void;
  onFinishCall: () => void;
  /** When provided, mission detail shows "Talk about this" which adds the mission and navigates to talk. */
  onTalkAboutMission?: (mission: MissionSuggestion) => void;
}

export default function BraveMissionsView({
  choices,
  onSelectMission,
  onFinishCall,
  onTalkAboutMission,
}: BraveMissionsViewProps) {
  const [selectedMission, setSelectedMission] = useState<MissionSuggestion | null>(null);
  const [detailMission, setDetailMission] = useState<MissionSuggestion | null>(null);

  const handleCardSelect = (mission: MissionSuggestion) => {
    if (selectedMission?.title === mission.title) {
      setDetailMission(mission);
    } else {
      setSelectedMission(mission);
    }
  };

  const handleAccept = () => {
    if (detailMission) {
      onSelectMission(detailMission);
      setDetailMission(null);
      setSelectedMission(null);
    }
  };

  const handleDeclineOrDismiss = () => {
    setDetailMission(null);
  };

  return (
    <>
      <MenuButton />

      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'max(80px, env(safe-area-inset-top)) 24px max(140px, calc(24px + env(safe-area-inset-bottom)))',
          gap: 24,
          maxWidth: 500,
          margin: '0 auto',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--v2-text-primary)',
            textAlign: 'center',
          }}
        >
          Brave Missions
        </h1>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            width: '100%',
          }}
        >
          {choices.map((choice) => (
            <MissionCard
              key={choice.title}
              mission={choice}
              isSelected={selectedMission?.title === choice.title}
              onSelect={() => handleCardSelect(choice)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onFinishCall}
          style={{
            marginTop: 16,
            padding: '14px 28px',
            borderRadius: 'var(--v2-radius-pill)',
            border: 'none',
            background: 'var(--v2-finish-call)',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--v2-shadow-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'background var(--v2-transition-fast), transform var(--v2-transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--v2-finish-call-dark)')}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--v2-finish-call)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Flag size={20} strokeWidth={2.5} />
          Finish call
        </button>
      </main>

      {detailMission && (
        <MissionDetailModal
          mission={detailMission}
          onAccept={handleAccept}
          onDecline={handleDeclineOrDismiss}
          onDismiss={handleDeclineOrDismiss}
          onTalkAbout={onTalkAboutMission}
        />
      )}
    </>
  );
}
