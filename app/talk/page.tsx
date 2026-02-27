'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useMicPermission } from '@/app/hooks/useMicPermission';
import { useSpeechConversation } from '@/app/hooks/useSpeechConversation';
import { useMissions } from '@/app/hooks/useMissions';
import { usePersonalMemory } from '@/app/hooks/usePersonalMemory';
import TurtleCharacter from '@/app/components/talk/TurtleCharacter';
import MuteButton from '@/app/components/talk/MuteButton';
import EndButton from '@/app/components/talk/EndButton';
import ClearButton from '@/app/components/talk/ClearButton';
import MicPermission from '@/app/components/talk/MicPermission';
import MissionSelectView from '@/app/components/talk/MissionSelectView';
import ConversationSubtitles from '@/app/components/talk/ConversationSubtitles';
import type { MissionSuggestion } from '@/lib/speech/types';

const STATE_LABELS: Record<string, string> = {
  idle: 'Getting ready...',
  listening: 'Shelly is listening 👂',
  recording: 'I hear you! 🎤',
  processing: 'Shelly is thinking... 🐢',
  speaking: 'Shelly is speaking!',
  muted: 'Microphone off 🔇',
  ended: 'Goodbye! 🌊',
};

function ConversationView() {
  const router = useRouter();
  const { addMission, completedMissions } = useMissions();
  const { childName, messages: savedMessages, topics, saveChildName, saveMessages, saveTopic, clearAll } =
    usePersonalMemory();

  const [pendingMissionChoices, setPendingMissionChoices] = useState<MissionSuggestion[] | null>(null);
  const [missionDeclined, setMissionDeclined] = useState(false);

  const difficultyProfile: 'beginner' | 'intermediate' | 'confident' =
    completedMissions.length >= 5 ? 'confident'
    : completedMissions.length >= 2 ? 'intermediate'
    : 'beginner';

  const { state, mood, messages, isMuted, error, toggleMute, endConversation, startListening } =
    useSpeechConversation({
      onEnd: () => router.push('/missions'),
      onMissionChoices: setPendingMissionChoices,
      initialMessages: savedMessages,
      childName,
      topics,
      onChildName: saveChildName,
      onTopic: saveTopic,
      onMessagesChange: saveMessages,
      difficultyProfile,
      missionDeclined,
    });

  // Auto-start listening on mount
  useEffect(() => {
    startListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (pendingMissionChoices) {
    return (
      <MissionSelectView
        choices={pendingMissionChoices}
        onSelect={(choice) => {
          addMission(choice);
          setPendingMissionChoices(null);
          setMissionDeclined(false);
        }}
        onDismiss={() => {
          setPendingMissionChoices(null);
          setMissionDeclined(true);
        }}
      />
    );
  }

  return (
    <main
      style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        paddingTop: 80,
        paddingBottom: 24,
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      {/* Top header bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          zIndex: 20,
        }}
      >
        <button
          onClick={() => { endConversation(); router.push('/'); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.12)',
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
          }}
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          Home
        </button>
        <span
          style={{
            color: 'white',
            fontSize: '1.1rem',
            fontWeight: 800,
            textShadow: '0 2px 6px rgba(0,0,0,0.4)',
            letterSpacing: '-0.01em',
          }}
        >
          TurtleTalk
        </span>
      </div>

      <TurtleCharacter mood={mood} size={240} />

      <p
        style={{
          color: 'white',
          fontSize: 18,
          fontWeight: 600,
          textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          minHeight: 28,
          textAlign: 'center',
        }}
      >
        {STATE_LABELS[state] ?? ''}
      </p>

      {/* Subtitle area OR error overlay */}
      {error ? (
        <div
          style={{
            width: '100%',
            maxWidth: 480,
            background: 'rgba(0,0,0,0.28)',
            backdropFilter: 'blur(12px)',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.15)',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 40 }}>🐢</span>
          <p style={{ color: 'white', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
            Oops! Shelly had a little hiccup.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', margin: 0 }}>
            Let&apos;s try again!
          </p>
          <button
            onClick={() => startListening()}
            style={{
              marginTop: 4,
              padding: '10px 24px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.18)',
              color: 'white',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Try again 🌊
          </button>
        </div>
      ) : (
        <ConversationSubtitles messages={messages} state={state} />
      )}

      {/* Controls row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          marginTop: 8,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <ClearButton onClear={clearAll} />
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 600 }}>Start over</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <EndButton onEnd={endConversation} />
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 600 }}>End call</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <MuteButton isMuted={isMuted} onToggle={toggleMute} />
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 600 }}>
            {isMuted ? 'Unmute' : 'Mute'}
          </span>
        </div>
      </div>
    </main>
  );
}

export default function TalkPage() {
  const { status, requestPermission } = useMicPermission();
  const router = useRouter();

  if (status === 'checking') {
    return (
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: 'white', fontSize: 18 }}>Loading...</p>
      </main>
    );
  }

  if (status === 'denied') {
    return (
      <MicPermission
        onGranted={requestPermission}
        onDenied={() => router.push('/')}
      />
    );
  }

  if (status === 'prompt') {
    return (
      <MicPermission
        onGranted={requestPermission}
        onDenied={() => router.push('/')}
      />
    );
  }

  // status === 'granted'
  return <ConversationView />;
}
