'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMicPermission } from '@/app/hooks/useMicPermission';
import { useVoiceSession } from '@/app/hooks/useVoiceSession';
import { useMissions } from '@/app/hooks/useMissions';
import { usePersonalMemory } from '@/app/hooks/usePersonalMemory';
import { useChildSession } from '@/app/hooks/useChildSession';
import { useCallFeedback } from '@/app/hooks/useCallFeedback';
import { createVoiceProvider } from '@/lib/speech/voice';
import { getDeviceId } from '@/lib/db';
import type { MissionSuggestion } from '@/lib/speech/types';
import type { CallRating } from '../components/HowWasYourCallModal';
import BraveMissionsView from '../components/BraveMissionsView';
import PostCallModal from '../components/PostCallModal';
import MenuButton from '../components/MenuButton';
import TalkStatusIndicator from '../components/TalkStatusIndicator';
import TalkTitleTile from '../components/TalkTitleTile';
import ShellyLogoPlaceholder from '../components/ShellyLogoPlaceholder';
import TalkConversationCard from '../components/TalkConversationCard';
import TalkEndCallButton from '../components/TalkEndCallButton';
import TalkMuteToggle from '../components/TalkMuteToggle';
import MicPermissionV2 from '../components/MicPermissionV2';
import HowWasYourCallModal from '../components/HowWasYourCallModal';

const DEBUG_INGEST = 'http://127.0.0.1:7379/ingest/c4e58649-e133-4b9b-91a5-50c962a7060e';
const DEBUG_SESSION = 'd47add';

const ACTIVE_STATES = new Set([
  'listening',
  'recording',
  'processing',
  'speaking',
  'muted',
]);

function V2ConversationView() {
  const router = useRouter();
  const { child } = useChildSession();
  const childId = child?.childId;
  const { saveCallFeedback } = useCallFeedback();
  const { addMission, completedMissions, activeMissions } = useMissions(childId);
  const {
    childName,
    messages: savedMessages,
    topics,
    saveChildName,
    saveMessages,
    saveTopic,
  } = usePersonalMemory(childId);

  const [pendingMissionChoices, setPendingMissionChoices] = useState<MissionSuggestion[] | null>(
    null,
  );
  const [feedbackModalDismissed, setFeedbackModalDismissed] = useState(false);
  const [showFeedbackThenPostCall, setShowFeedbackThenPostCall] = useState(false);
  const [showPostCallModal, setShowPostCallModal] = useState(false);

  const callEndedAtRef = useRef<string | null>(null);
  const feedbackRatingRef = useRef<CallRating | null>(null);

  const difficultyProfile: 'beginner' | 'intermediate' | 'confident' =
    completedMissions.length >= 5
      ? 'confident'
      : completedMissions.length >= 2
        ? 'intermediate'
        : 'beginner';

  const activeMission = activeMissions[0] ?? null;

  const providerRef = useRef<ReturnType<typeof createVoiceProvider> | null>(null);
  if (!providerRef.current) providerRef.current = createVoiceProvider();

  const {
    state,
    messages,
    pendingUserTranscript,
    isMuted,
    error,
    toggleMute,
    endConversation,
    startListening,
  } = useVoiceSession(providerRef.current, {
    onEnd: () => {},
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

  // #region agent log — v2/talk conversation view mounted and startListening wrapper
  useEffect(() => {
    fetch(DEBUG_INGEST, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': DEBUG_SESSION }, body: JSON.stringify({ sessionId: DEBUG_SESSION, location: 'app/v2/talk/page.tsx:conversation_mount', message: 'v2/talk conversation view mounted', data: {}, timestamp: Date.now(), hypothesisId: 'v2_talk' }) }).catch(() => {});
  }, []);
  const startListeningWrapped = useCallback(async () => {
    fetch(DEBUG_INGEST, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': DEBUG_SESSION }, body: JSON.stringify({ sessionId: DEBUG_SESSION, location: 'app/v2/talk/page.tsx:startListening', message: 'v2/talk startListening called', data: {}, timestamp: Date.now(), hypothesisId: 'v2_talk' }) }).catch(() => {});
    await startListening();
  }, [startListening]);
  // #endregion

  const hasError = !!error;
  const status = hasError ? 'error' : state === 'connecting' ? 'warning' : 'ok';
  const callActive = ACTIVE_STATES.has(state);

  useEffect(() => {
    if (state !== 'ended') setFeedbackModalDismissed(false);
  }, [state]);

  const showHowWasYourCallModal =
    state === 'ended' && !showPostCallModal && (showFeedbackThenPostCall || !feedbackModalDismissed);
  const showPostCallAfterFeedback = state === 'ended' && showPostCallModal;

  useEffect(() => {
    if (showHowWasYourCallModal && !callEndedAtRef.current) {
      callEndedAtRef.current = new Date().toISOString();
    }
  }, [showHowWasYourCallModal]);

  const handleFeedbackDone = useCallback(() => {
    const callEndedAt = callEndedAtRef.current ?? new Date().toISOString();
    const dismissedAt = new Date().toISOString();
    const timeToDismissMs =
      callEndedAtRef.current != null
        ? Date.now() - new Date(callEndedAtRef.current).getTime()
        : undefined;
    const effectiveChildId =
      childId ?? (typeof window !== 'undefined' ? getDeviceId() : 'default');
    saveCallFeedback({
      childId: effectiveChildId,
      rating: feedbackRatingRef.current ?? null,
      dismissedAt,
      callEndedAt,
      source: 'v2',
      ...(timeToDismissMs != null && { timeToDismissMs }),
    }).finally(() => {
      callEndedAtRef.current = null;
      feedbackRatingRef.current = null;
      if (showFeedbackThenPostCall) {
        setShowFeedbackThenPostCall(false);
        setShowPostCallModal(true);
      } else {
        setFeedbackModalDismissed(true);
      }
    });
  }, [childId, saveCallFeedback, showFeedbackThenPostCall]);

  if (pendingMissionChoices) {
    return (
      <BraveMissionsView
        choices={pendingMissionChoices}
        onSelectMission={(choice) => {
          addMission(choice);
          setPendingMissionChoices(null);
          router.push('/missions');
        }}
        onFinishCall={() => {
          setPendingMissionChoices(null);
          setShowFeedbackThenPostCall(true);
        }}
      />
    );
  }

  return (
    <>
      {showHowWasYourCallModal && (
        <HowWasYourCallModal
          onSelect={(rating) => {
            feedbackRatingRef.current = rating;
          }}
          onDone={handleFeedbackDone}
        />
      )}

      {showPostCallAfterFeedback && (
        <PostCallModal
          onNewCall={() => {
            setShowPostCallModal(false);
            startListeningWrapped();
          }}
          onGoHome={() => {
            setShowPostCallModal(false);
            router.push('/v2');
          }}
        />
      )}

      <MenuButton />

      <div
        style={{
          position: 'fixed',
          top: 'max(16px, env(safe-area-inset-top))',
          right: 'max(16px, env(safe-area-inset-right))',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <TalkStatusIndicator status={status} hasError={hasError} />
      </div>

      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'max(80px, env(safe-area-inset-top)) 24px max(120px, calc(24px + env(safe-area-inset-bottom)))',
          gap: 20,
          maxWidth: 500,
          margin: '0 auto',
        }}
      >
        <TalkTitleTile />
        <ShellyLogoPlaceholder />
        <TalkConversationCard
          messages={messages}
          pendingUserTranscript={pendingUserTranscript}
        />
        <TalkEndCallButton
          state={state}
          hasError={hasError}
          onEnd={endConversation}
          onRetry={startListeningWrapped}
          onStart={startListeningWrapped}
        />
        <TalkMuteToggle isMuted={isMuted} onToggle={toggleMute} callActive={callActive} />
      </main>
    </>
  );
}

export default function V2TalkPage() {
  const { status, requestPermission } = useMicPermission();
  const router = useRouter();

  if (status === 'checking') {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--v2-bg)',
        }}
      >
        <p style={{ color: 'var(--v2-text-secondary)', fontSize: '1.125rem' }}>Loading...</p>
      </main>
    );
  }

  if (status === 'denied' || status === 'prompt') {
    return (
      <MicPermissionV2
        onGranted={requestPermission}
        onDenied={() => router.push('/v2')}
      />
    );
  }

  return <V2ConversationView />;
}
