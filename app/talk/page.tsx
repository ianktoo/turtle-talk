'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMicPermission } from '@/app/hooks/useMicPermission';
import { useSpeechConversation } from '@/app/hooks/useSpeechConversation';
import { useMissions } from '@/app/hooks/useMissions';
import TurtleCharacter from '@/app/components/talk/TurtleCharacter';
import MuteButton from '@/app/components/talk/MuteButton';
import EndButton from '@/app/components/talk/EndButton';
import MicPermission from '@/app/components/talk/MicPermission';

const STATE_LABELS: Record<string, string> = {
  idle: 'Ready...',
  listening: 'Listening...',
  recording: 'I hear you!',
  processing: 'Thinking...',
  speaking: 'Speaking...',
  muted: 'Muted',
  ended: 'Goodbye!',
};

function ConversationView() {
  const router = useRouter();
  const { addMission } = useMissions();
  const { state, mood, isMuted, error, toggleMute, endConversation, startListening } =
    useSpeechConversation({ onEnd: () => router.push('/missions'), onMission: addMission });

  // Auto-start listening on mount
  useEffect(() => {
    startListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        gap: 24,
      }}
    >
      <TurtleCharacter mood={mood} size={240} />

      <p
        style={{
          color: 'white',
          fontSize: 20,
          fontWeight: 600,
          textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          minHeight: 28,
        }}
      >
        {STATE_LABELS[state] ?? ''}
      </p>

      {error && (
        <p style={{ color: '#fca5a5', fontSize: 14, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginTop: 8 }}>
        <MuteButton isMuted={isMuted} onToggle={toggleMute} />
        <EndButton onEnd={endConversation} />
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
