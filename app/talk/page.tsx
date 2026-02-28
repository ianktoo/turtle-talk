'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { useMicPermission } from '@/app/hooks/useMicPermission';
import { useVoiceSession } from '@/app/hooks/useVoiceSession';
import { useMissions } from '@/app/hooks/useMissions';
import { usePersonalMemory } from '@/app/hooks/usePersonalMemory';
import { VapiVoiceProvider } from '@/lib/speech/voice/vapi';
import TurtleCharacter from '@/app/components/talk/TurtleCharacter';
import MicPermission from '@/app/components/talk/MicPermission';
import MissionSelectView from '@/app/components/talk/MissionSelectView';
import ConversationSubtitles from '@/app/components/talk/ConversationSubtitles';
import type { MissionSuggestion } from '@/lib/speech/types';

const STATE_LABELS: Record<string, string> = {
  idle:       'Getting ready...',
  listening:  'Shelly is listening 👂',
  recording:  'I hear you! 🎤',
  processing: 'Shelly is thinking... 🐢',
  speaking:   'Shelly is speaking!',
  muted:      'Microphone off 🔇',
  ended:      'Goodbye! 🌊',
};

function ConversationView() {
  const router = useRouter();
  const { addMission, completedMissions, activeMissions } = useMissions();
  const { childName, messages: savedMessages, topics, saveChildName, saveMessages, saveTopic } =
    usePersonalMemory();

  const [pendingMissionChoices, setPendingMissionChoices] = useState<MissionSuggestion[] | null>(null);

  // Use a ref so the onEnd callback always reads the latest value without needing re-registration
  const pendingChoicesRef = useRef<MissionSuggestion[] | null>(null);
  pendingChoicesRef.current = pendingMissionChoices;

  const difficultyProfile: 'beginner' | 'intermediate' | 'confident' =
    completedMissions.length >= 5 ? 'confident'
    : completedMissions.length >= 2 ? 'intermediate'
    : 'beginner';

  // The child's first active mission, if any — passed to the agent for coaching
  const activeMission = activeMissions[0] ?? null;

  // Stable provider instance — one per mount
  const providerRef = useRef<VapiVoiceProvider | null>(null);
  if (!providerRef.current) providerRef.current = new VapiVoiceProvider();

  const { state, mood, messages, isMuted, error, toggleMute, endConversation, startListening } =
    useVoiceSession(providerRef.current, {
      // If missions are pending, don't navigate immediately — MissionSelectView handles it
      onEnd: () => { if (!pendingChoicesRef.current) router.push('/missions'); },
      onMissionChoices: setPendingMissionChoices,
      initialMessages: savedMessages,
      childName,
      topics,
      onChildName: saveChildName,
      onTopic: saveTopic,
      onMessagesChange: saveMessages,
      difficultyProfile,
      activeMission,
    });

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
          router.push('/missions');
        }}
        onDismiss={() => {
          setPendingMissionChoices(null);
          router.push('/missions');
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
        paddingTop: 64,
        paddingBottom: 40,
        paddingLeft: 20,
        paddingRight: 20,
        gap: 24,
      }}
    >
      {/* ── Top bar: just mute icon (left) + TurtleTalk title ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          zIndex: 20,
        }}
      >
        {/* Mute — small, unobtrusive */}
        <button
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.22)',
            background: isMuted ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.1)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
        >
          {isMuted
            ? <MicOff size={18} strokeWidth={2} color="#fbbf24" />
            : <Mic    size={18} strokeWidth={2} color="white"   />}
        </button>

        <span
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.95rem',
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}
        >
          TurtleTalk
        </span>

        {/* Spacer to keep title centred */}
        <div style={{ width: 40 }} />
      </div>

      {/* ── Turtle ── */}
      <TurtleCharacter mood={mood} size={220} />

      {/* ── Status label ── */}
      <p
        style={{
          color: 'rgba(255,255,255,0.65)',
          fontSize: '0.95rem',
          fontWeight: 600,
          margin: 0,
          textAlign: 'center',
          minHeight: 22,
        }}
      >
        {STATE_LABELS[state] ?? ''}
      </p>

      {/* ── Subtitles or error ── */}
      {error ? (
        <div
          style={{
            width: '100%',
            maxWidth: 440,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 36 }}>🐢</span>
          <p style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
            Oops! Shelly had a little hiccup.
          </p>
          <button
            onClick={() => startListening()}
            style={{
              marginTop: 4,
              padding: '10px 28px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              fontSize: '1rem',
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

      {/* ── End call — the only prominent control ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <button
          onClick={endConversation}
          aria-label="End call"
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #dc2626, #ef4444)',
            boxShadow: '0 6px 24px rgba(220,38,38,0.5)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PhoneOff size={30} color="white" strokeWidth={2} />
        </button>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600 }}>
          End call
        </span>
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
          position: 'relative', zIndex: 10, minHeight: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <p style={{ color: 'white', fontSize: 18 }}>Loading...</p>
      </main>
    );
  }

  if (status === 'denied' || status === 'prompt') {
    return <MicPermission onGranted={requestPermission} onDenied={() => router.push('/')} />;
  }

  return <ConversationView />;
}
