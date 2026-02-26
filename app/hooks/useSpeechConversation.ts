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
  onMission?: (mission: MissionSuggestion) => void;
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

const VAD_THRESHOLD = 15;
const VAD_START_MS = 150;
const VAD_STOP_MS = 600;
const POLL_INTERVAL_MS = 100;

export function useSpeechConversation(
  options: UseSpeechConversationOptions = {},
): UseSpeechConversationResult {
  const { onEnd, onMission } = options;

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

  // Keep refs in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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
      setStateSync('processing');
      setMood('confused'); // thinking face while processing

      const formData = new FormData();
      formData.append('audio', blob, 'audio.webm');
      formData.append('messages', JSON.stringify(messagesRef.current));

      try {
        const res = await fetch('/api/talk', { method: 'POST', body: formData });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        if (!res.body) throw new Error('No response body');

        // Stream NDJSON — two events:
        //   {type:'meta', userText, responseText, mood, mission?}  ← arrives after LLM
        //   {type:'audio', base64}                                  ← arrives after TTS
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

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
              const { userText, responseText, mood: responseMood, mission } = event as {
                userText: string; responseText: string; mood: TurtleMood; mission?: unknown;
              };

              if (mission) onMission?.(mission as Parameters<typeof onMission>[0]);

              setMessages([
                ...messagesRef.current,
                { role: 'user', content: userText },
                { role: 'assistant', content: responseText },
              ]);

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
      } catch (err) {
        console.error('[useSpeechConversation] sendAudio error:', err);
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setStateSync('listening');
        setMood('listening');
      }
    },
    [setStateSync, onMission, playAudio],
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
