/**
 * Log entry for the non-blocking logging agent.
 * NDJSON: one JSON object per line in logs/voice-session.log
 */
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export type LogCategory =
  | 'state_machine'
  | 'voice_native'
  | 'voice_vapi'
  | 'api_talk'
  | 'tool_call'
  | 'summary'
  | 'thinking';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  event: string;
  payload?: Record<string, unknown>;
}
