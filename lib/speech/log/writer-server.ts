/**
 * Server-only background writer: drains logAgent and appends NDJSON to logs/voice-session.log.
 * Import and call startVoiceSessionLogWriter() only from server code (e.g. app/api/talk/route.ts).
 */

import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { LogEntry } from './types';

interface LogAgentWithDrain {
  drain(max?: number): LogEntry[];
}

const LOG_DIR = process.env.VOICE_SESSION_LOG_DIR ?? join(process.cwd(), 'logs');
const LOG_FILE = join(LOG_DIR, 'voice-session.log');
const DRAIN_INTERVAL_MS = 500;
const BATCH_SIZE = 100;

let intervalId: ReturnType<typeof setInterval> | null = null;

function ensureLogDir(): void {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
}

function writeBatch(entries: LogEntry[]): void {
  if (entries.length === 0) return;
  try {
    ensureLogDir();
    const lines = entries.map((e) => JSON.stringify(e)).join('\n') + '\n';
    appendFileSync(LOG_FILE, lines);
  } catch {
    // Drop on failure; never block. Optionally could truncate queue.
  }
}

/**
 * Start the background writer that drains the given agent and writes to logs/voice-session.log.
 * Call once from server entry (e.g. talk route). No-op if ENABLE_SESSION_LOGGING is not set.
 */
export function startVoiceSessionLogWriter(agent: LogAgentWithDrain): void {
  if (process.env.ENABLE_SESSION_LOGGING !== 'true') return;
  if (intervalId !== null) return;
  intervalId = setInterval(() => {
    const batch = agent.drain(BATCH_SIZE);
    writeBatch(batch);
  }, DRAIN_INTERVAL_MS);
}
