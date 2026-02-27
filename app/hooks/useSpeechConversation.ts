'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { TurtleMood, Message, MissionSuggestion } from '@/lib/speech/types';

export type ConversationState =
  | 'idle'
  | 'listening'
  | 'recording'
  | 'processing'
  | 'speaking'
  | 'muted'
  | 'ended';

interface UseSpeechConversationOptions {
  onEnd?: () => void;
  onMissionChoices?: (choices: MissionSuggestion[]) => void;
  initialMessages?: Message[];
  childName?: string | null;
  topics?: string[];
  onChildName?: (name: string) => void;
  onTopic?: (topic: string) => void;
  onMessagesChange?: (msgs: Message[]) => void;
  difficultyProfile?: 'beginner' | 'intermediate' | 'confident';
  missionDeclined?: boolean;
}

interface UseSpeechConversationResult {
  state: ConversationState;
  mood: TurtleMood;
  messages: Message[];
  isMuted: boolean;
  error: string | null;
  toggleMute: () => void;
  endConversation: () => void;
  startListening: () => Promise<void>;
}

const VAD_THRESHOLD = 35;    // raised from 15 — ambient noise sits at 8-20, real speech at 40+
const VAD_START_MS = 150;
const VAD_STOP_MS = 600;
const POLL_INTERVAL_MS = 100;
const MIN_AUDIO_BYTES = 6000; // ~400ms of real speech; smaller blobs are likely noise

export function useSpeechConversation(
  options: UseSpeechConversationOptions = {},
): UseSpeechConversationResult {
  const { onEnd } = options;

  const [state, setState] = useState<ConversationState>('idle');
  const [mood, setMood] = useState<TurtleMood>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stateRef = useRef<ConversationState>('idle');
  const prevStateRef = useRef<ConversationState>('idle');
  const vadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const pendingEndRef = useRef(false);
  const endConversationRef = useRef<() => void>(() => {});
  const onChildNameRef = useRef(options.onChildName);
  const onTopicRef = useRef(options.onTopic);
  const onMessagesChangeRef = useRef(options.onMessagesChange);
  const childNameRef = useRef(options.childName);
  const topicsRef = useRef(options.topics);
  const onMissionChoicesRef = useRef(options.onMissionChoices);
  const difficultyProfileRef = useRef(options.difficultyProfile);
  const missionDeclinedRef = useRef(options.missionDeclined);
  const initializedRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { onChildNameRef.current = options.onChildName; });
  useEffect(() => { onTopicRef.current = options.onTopic; });
  useEffect(() => { onMessagesChangeRef.current = options.onMessagesChange; });
  useEffect(() => { childNameRef.current = options.childName; });
  useEffect(() => { topicsRef.current = options.topics; });
  useEffect(() => { onMissionChoicesRef.current = options.onMissionChoices; });
  useEffect(() => { difficultyProfileRef.current = options.difficultyProfile; });
  useEffect(() => { missionDeclinedRef.current = options.missionDeclined; });

  // One-shot sync of persisted messages from localStorage (arrives after async useEffect in caller)
  useEffect(() => {
    if (!initializedRef.current && options.initialMessages?.length) {
      initializedRef.current = true;
      setMessages(options.initialMessages);
      messagesRef.current = options.initialMessages;
    }
  }, [options.initialMessages]);

  const setStateSync = useCallback((s: ConversationState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  const cleanup = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (vadTimerRef.current) clearTimeout(vadTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }, []);

  const playAudio = useCallback(
    async (base64: string) => {
      const audioData = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const playCtx = new AudioContext();
      const decoded = await playCtx.decodeAudioData(audioData.buffer);
      const source = playCtx.createBufferSource();
      source.buffer = decoded;
      source.connect(playCtx.destination);
      source.start();
      source.onended = () => {
        playCtx.close();
        if (pendingEndRef.current) {
          pendingEndRef.current = false;
          endConversationRef.current();
          return;
        }
        if (stateRef.current !== 'ended' && stateRef.current !== 'muted') {
          setStateSync('listening');
          setMood('listening');
        }
      };
    },
    [setStateSync],
  );

  const sendAudio = useCallback(
    async (blob: Blob) => {
      // Discard noise-only clips — too small to contain real speech
      if (blob.size < MIN_AUDIO_BYTES) {
        setStateSync('listening');
        setMood('listening');
        return;
      }

      setStateSync('processing');
      setMood('confused'); // thinking face while processing

      const formData = new FormData();
      formData.append('audio', blob, 'audio.webm');
      formData.append('messages', JSON.stringify(messagesRef.current));
      if (childNameRef.current) formData.append('childName', childNameRef.current);
      if (topicsRef.current?.length) formData.append('topics', JSON.stringify(topicsRef.current));
      if (difficultyProfileRef.current) formData.append('difficultyProfile', difficultyProfileRef.current);
      if (missionDeclinedRef.current) formData.append('missionDeclined', 'true');

      try {
        const res = await fetch('/api/talk', { method: 'POST', body: formData });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        if (!res.body) throw new Error('No response body');

        // Stream NDJSON — two events:
        //   {type:'meta', userText, responseText, mood, missionChoices?}  ← arrives after LLM
        //   {type:'audio', base64}                                         ← arrives after TTS
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let receivedMeta = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as Record<string, unknown>;

            if (event.type === 'meta') {
              receivedMeta = true;
              const { userText, responseText, mood: responseMood, missionChoices, endConversation: shouldEnd, childName: detectedName, topic } = event as {
                userText: string; responseText: string; mood: TurtleMood; missionChoices?: unknown; endConversation?: boolean; childName?: string; topic?: string;
              };

              if (missionChoices) onMissionChoicesRef.current?.(missionChoices as MissionSuggestion[]);
              if (shouldEnd) pendingEndRef.current = true;
              if (detectedName) onChildNameRef.current?.(detectedName);
              if (topic) onTopicRef.current?.(topic);

              const updatedMessages: Message[] = [
                ...messagesRef.current,
                { role: 'user', content: userText },
                { role: 'assistant', content: responseText },
              ];
              setMessages(updatedMessages);
              onMessagesChangeRef.current?.(updatedMessages);

              // Update turtle face immediately — before audio is ready
              setStateSync('speaking');
              setMood(responseMood ?? 'talking');
            } else if (event.type === 'audio') {
              await playAudio(event.base64 as string);
            } else if (event.type === 'error') {
              throw new Error(event.error as string);
            }
          }
        }

        // Stream closed without a meta event (e.g., empty transcription silently discarded).
        // Recover from stuck 'processing' state so VAD can resume.
        if (!receivedMeta && stateRef.current === 'processing') {
          setStateSync('listening');
          setMood('listening');
        }
      } catch (err) {
        console.error('[useSpeechConversation] sendAudio error:', err);
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setStateSync('listening');
        setMood('listening');
      }
    },
    [setStateSync, playAudio],
  );

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      chunksRef.current = [];
      sendAudio(blob);
    };
    recorder.stop();
  }, [sendAudio]);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = recorder;
    recorder.start();
    setStateSync('recording');
    setMood('listening');
  }, [setStateSync]);

  const startListening = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      setStateSync('listening');
      setMood('listening');

      let aboveThresholdSince: number | null = null;
      let belowThresholdSince: number | null = null;

      const dataArr = new Uint8Array(analyser.frequencyBinCount);

      pollIntervalRef.current = setInterval(() => {
        const currentState = stateRef.current;
        if (currentState === 'ended' || currentState === 'muted') return;
        if (currentState === 'processing' || currentState === 'speaking') return;

        analyser.getByteFrequencyData(dataArr);
        const avg = dataArr.reduce((a, b) => a + b, 0) / dataArr.length;

        if (currentState === 'listening') {
          if (avg > VAD_THRESHOLD) {
            if (!aboveThresholdSince) aboveThresholdSince = Date.now();
            if (Date.now() - aboveThresholdSince >= VAD_START_MS) {
              aboveThresholdSince = null;
              belowThresholdSince = null;
              startRecording();
            }
          } else {
            aboveThresholdSince = null;
          }
        } else if (currentState === 'recording') {
          if (avg < VAD_THRESHOLD) {
            if (!belowThresholdSince) belowThresholdSince = Date.now();
            if (Date.now() - belowThresholdSince >= VAD_STOP_MS) {
              belowThresholdSince = null;
              aboveThresholdSince = null;
              stopRecording();
            }
          } else {
            belowThresholdSince = null;
          }
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setError('Could not access microphone');
      console.error('[useSpeechConversation] startListening error:', err);
    }
  }, [setStateSync, startRecording, stopRecording]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nowMuted = !prev;
      if (nowMuted) {
        prevStateRef.current = stateRef.current;
        audioCtxRef.current?.suspend();
        setStateSync('muted');
        setMood('idle');
      } else {
        audioCtxRef.current?.resume();
        const restore = prevStateRef.current === 'muted' ? 'listening' : prevStateRef.current;
        setStateSync(restore);
        setMood('listening');
      }
      return nowMuted;
    });
  }, [setStateSync]);

  const endConversation = useCallback(() => {
    cleanup();
    setStateSync('ended');
    setMood('idle');
    onEnd?.();
  }, [cleanup, setStateSync, onEnd]);

  useEffect(() => {
    endConversationRef.current = endConversation;
  }, [endConversation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    state,
    mood,
    messages,
    isMuted,
    error,
    toggleMute,
    endConversation,
    startListening,
  };
}
