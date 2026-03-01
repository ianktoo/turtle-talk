import type { TurtleMood } from '../../types';

export type VoiceSessionState =
  | 'idle'
  | 'listening'
  | 'recording'
  | 'processing'
  | 'speaking'
  | 'muted'
  | 'ended';

export type VoiceSessionEvent =
  | 'START'
  | 'VAD_SPEECH_START'
  | 'VAD_SPEECH_END'
  | 'META_RECEIVED'
  | 'AUDIO_ENDED'
  | 'MUTE'
  | 'UNMUTE'
  | 'IDLE_TIMEOUT'
  | 'USER_WAKE'
  | 'END';

export interface VoiceSessionSnapshot {
  state: VoiceSessionState;
  mood: TurtleMood;
  /** When in listening and countdown active: seconds until pause (5, 4, 3, 2, 1). Null otherwise. */
  idleCountdownRemaining: number | null;
}
