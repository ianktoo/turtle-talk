/**
 * Single source of truth for voice session state. All transitions go through transition().
 * Providers emit low-level events; the machine owns state and notifies subscribers.
 */

import type { TurtleMood } from '../../types';
import type { VoiceSessionState, VoiceSessionEvent, VoiceSessionSnapshot } from './types';

const DEFAULT_MOOD: TurtleMood = 'idle';

/** Payload for META_RECEIVED: mood from server. */
export interface TransitionPayload {
  mood?: TurtleMood;
}

/** Valid transitions: from state + event -> { state, mood? }. mood overrides default. */
const TRANSITIONS: Partial<Record<string, { state: VoiceSessionState; mood?: TurtleMood }>> = {
  idle_START: { state: 'listening', mood: 'listening' },
  ended_START: { state: 'listening', mood: 'listening' },
  listening_VAD_SPEECH_START: { state: 'recording', mood: 'listening' },
  listening_MUTE: { state: 'muted', mood: 'idle' },
  listening_IDLE_TIMEOUT: { state: 'muted', mood: 'idle' },
  listening_END: { state: 'ended', mood: 'idle' },
  recording_VAD_SPEECH_END: { state: 'processing', mood: 'confused' },
  recording_MUTE: { state: 'muted', mood: 'idle' },
  recording_END: { state: 'ended', mood: 'idle' },
  processing_META_RECEIVED: { state: 'speaking' }, // mood from payload
  processing_MUTE: { state: 'muted', mood: 'idle' },
  processing_END: { state: 'ended', mood: 'idle' },
  speaking_AUDIO_ENDED: { state: 'listening', mood: 'listening' },
  speaking_MUTE: { state: 'muted', mood: 'idle' },
  speaking_END: { state: 'ended', mood: 'idle' },
  muted_UNMUTE: { state: 'listening', mood: 'listening' },
  muted_USER_WAKE: { state: 'listening', mood: 'listening' },
  muted_END: { state: 'ended', mood: 'idle' },
};

const IDLE_COUNTDOWN_DEFAULT_SECONDS = 5;

export class VoiceSessionStateMachine {
  private state: VoiceSessionState = 'idle';
  private mood: TurtleMood = DEFAULT_MOOD;
  private idleCountdownRemaining: number | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private countdownTickTimer: ReturnType<typeof setTimeout> | null = null;
  private subscribers: Array<(snapshot: VoiceSessionSnapshot) => void> = [];

  getState(): VoiceSessionState {
    return this.state;
  }

  getSnapshot(): VoiceSessionSnapshot {
    return {
      state: this.state,
      mood: this.mood,
      idleCountdownRemaining: this.idleCountdownRemaining,
    };
  }

  /**
   * Apply event; if valid, update state/mood and notify subscribers. Sync; no await.
   */
  transition(event: VoiceSessionEvent, payload?: TransitionPayload): void {
    const key = `${this.state}_${event}`;
    const next = TRANSITIONS[key];
    if (!next) return;

    const prevState = this.state;
    this.state = next.state;
    if (next.mood !== undefined) this.mood = next.mood;
    else if (event === 'META_RECEIVED' && payload?.mood !== undefined) this.mood = payload.mood;

    this.cancelIdleCountdown();
    if (event === 'IDLE_TIMEOUT') this.idleCountdownRemaining = null;
    if (this.state === 'listening' && prevState === 'muted') this.idleCountdownRemaining = null;

    this.notify();
  }

  subscribe(callback: (snapshot: VoiceSessionSnapshot) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  /**
   * Start countdown when in listening. Each second decrements idleCountdownRemaining; at 0 fires IDLE_TIMEOUT.
   */
  startIdleCountdown(seconds: number = IDLE_COUNTDOWN_DEFAULT_SECONDS): void {
    if (this.state !== 'listening') return;
    this.cancelIdleCountdown();
    this.idleCountdownRemaining = seconds;
    this.notify();

    const tick = () => {
      if (this.state !== 'listening' || this.idleCountdownRemaining === null) return;
      this.idleCountdownRemaining -= 1;
      this.notify();
      if (this.idleCountdownRemaining <= 0) {
        this.idleCountdownRemaining = null;
        this.transition('IDLE_TIMEOUT');
      } else {
        this.countdownTickTimer = setTimeout(tick, 1000);
      }
    };
    this.countdownTickTimer = setTimeout(tick, 1000);
  }

  cancelIdleCountdown(): void {
    if (this.countdownTickTimer) {
      clearTimeout(this.countdownTickTimer);
      this.countdownTickTimer = null;
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.idleCountdownRemaining = null;
  }

  private notify(): void {
    const snapshot = this.getSnapshot();
    for (const cb of this.subscribers) {
      try {
        cb(snapshot);
      } catch (_) {
        // avoid one subscriber breaking others
      }
    }
  }
}
