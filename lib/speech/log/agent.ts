/**
 * Non-blocking logging agent for voice session events.
 * log(entry) only enqueues and returns immediately; never blocks the critical path.
 * On the server, startVoiceSessionLogWriter(logAgent) drains the queue to logs/voice-session.log (NDJSON).
 */

import type { LogEntry, LogCategory, LogLevel } from './types';

const MAX_QUEUE_SIZE = 5000;

class LogAgentImpl {
  private queue: LogEntry[] = [];

  /**
   * Enqueue a log entry and return immediately. Fire-and-forget; never await.
   * Callers on the critical path (route, SpeechService, chat, client) must not await this.
   */
  log(entry: Omit<LogEntry, 'timestamp'>): void {
    const full: LogEntry = { ...entry, timestamp: Date.now() };
    this.queue.push(full);
    if (this.queue.length > MAX_QUEUE_SIZE) {
      this.queue.shift();
    }
  }

  /** Convenience: log with category and event. */
  logEvent(category: LogCategory, event: string, payload?: Record<string, unknown>, level: LogLevel = 'info'): void {
    this.log({ level, category, event, payload });
  }

  /**
   * Drain and return up to N entries, clearing them from the queue. Used by the background writer only.
   * @internal
   */
  drain(max = 100): LogEntry[] {
    if (this.queue.length === 0) return [];
    return this.queue.splice(0, max);
  }
}

export const logAgent = new LogAgentImpl();
export type { LogEntry, LogCategory, LogLevel } from './types';
