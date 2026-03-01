export type SpeechStage = 'stt' | 'input-guardrail' | 'chat' | 'output-guardrail' | 'tts';

export class SpeechServiceError extends Error {
  constructor(
    message: string,
    public readonly stage: SpeechStage,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'SpeechServiceError';
  }
}

export class GuardrailBlockedError extends Error {
  constructor(
    public readonly stage: 'input' | 'output',
    public readonly reason: string,
    public readonly guardrailName: string,
  ) {
    super(`Guardrail "${guardrailName}" blocked ${stage}: ${reason}`);
    this.name = 'GuardrailBlockedError';
  }
}

// ---------------------------------------------------------------------------
// Error-presentation agent (sync, non-blocking)
// Maps internal errors to short, user-facing copy. No I/O; never delays STT/LLM/TTS.
// ---------------------------------------------------------------------------

export interface UserFacingSummary {
  message: string;
  suggestRetry: boolean;
}

const USER_FACING = {
  mic: "Couldn't access the microphone. Please check permissions and try again.",
  stt: "Shelly couldn't hear that clearly. Try again?",
  guardrail: "Let's talk about something else. What would you like to try?",
  chat: "Shelly needs a short break — try again in a moment.",
  tts: "Something went wrong with my voice. Try again in a moment.",
  network: "Something went wrong. Please try again in a moment.",
  /** Shown when a provider (e.g. ElevenLabs, OpenAI) returns "unusual activity" / abuse detection. */
  providerLimit:
    "Voice service is temporarily limited. Try again in a few minutes, or switch voice in settings.",
  default: "Shelly had a little hiccup. Please try again in a moment.",
} as const;

/**
 * Returns a short, friendly message for the given error. Pure sync mapping.
 */
export function getUserFacingMessage(error: unknown): string {
  return getUserFacingSummary(error).message;
}

/**
 * Returns user-facing message and whether to suggest retry (true) or "come back later" (false).
 * Accepts Error instances (server) or string (client, from provider/stream).
 */
export function getUserFacingSummary(error: unknown): UserFacingSummary {
  if (error instanceof SpeechServiceError) {
    switch (error.stage) {
      case 'stt':
        return { message: USER_FACING.stt, suggestRetry: true };
      case 'input-guardrail':
      case 'output-guardrail':
        return { message: USER_FACING.guardrail, suggestRetry: true };
      case 'chat':
        return { message: USER_FACING.chat, suggestRetry: false };
      case 'tts':
        return { message: USER_FACING.tts, suggestRetry: true };
      default:
        return { message: USER_FACING.default, suggestRetry: true };
    }
  }
  if (error instanceof GuardrailBlockedError) {
    return { message: USER_FACING.guardrail, suggestRetry: true };
  }
  const msg = typeof error === 'string' ? error : error instanceof Error ? error.message : String(error ?? '');
  if (/unusual activity|detected_unusual_activity|abuse|Free Tier.*disabled/i.test(msg)) {
    return { message: USER_FACING.providerLimit, suggestRetry: true };
  }
  if (/network|fetch|timeout|ECONNREFUSED|ETIMEDOUT/i.test(msg)) {
    return { message: USER_FACING.network, suggestRetry: true };
  }
  if (/microphone|getUserMedia|permission|Could not access/i.test(msg)) {
    return { message: USER_FACING.mic, suggestRetry: true };
  }
  if (/Speech-to-text|stt|transcri/i.test(msg)) return { message: USER_FACING.stt, suggestRetry: true };
  if (/Chat|LLM|chat provider/i.test(msg)) return { message: USER_FACING.chat, suggestRetry: false };
  if (/Text-to-speech|tts|synthesize/i.test(msg)) return { message: USER_FACING.tts, suggestRetry: true };
  return { message: USER_FACING.default, suggestRetry: true };
}

/**
 * True if the error is a provider "unusual activity" / abuse-detection response (e.g. ElevenLabs 401, OpenAI).
 * Use this to trigger fallback (e.g. retry with Gemini TTS when ElevenLabs returns this).
 */
export function isProviderUnusualActivityError(err: unknown): boolean {
  const msg = typeof err === 'string' ? err : err instanceof Error ? err.message : String(err ?? '');
  return /unusual activity|detected_unusual_activity|abuse|Free Tier.*disabled|Status code: 401/i.test(msg);
}
