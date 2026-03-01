/**
 * Startup health-check runner.
 * Runs a checklist of env/config checks (no blocking I/O). Used by instrumentation
 * and optional /api/health. Critical/error items mean required keys are missing.
 */

import type { HealthItem, HealthLevel, HealthResult } from './types';

function hasValue(v: string | undefined): boolean {
  return typeof v === 'string' && v.trim().length > 0;
}

function add(
  items: HealthItem[],
  id: string,
  level: HealthLevel,
  message: string,
  detail?: string
): void {
  items.push({ id, level, message, detail });
}

let cachedResult: HealthResult | null = null;

export function getCachedHealthResult(): HealthResult | null {
  return cachedResult;
}

export async function runHealthChecks(): Promise<HealthResult> {
  const items: HealthItem[] = [];
  const env = process.env;

  const chatProvider = (env.SPEECH_CHAT_PROVIDER ?? 'gemini') as string;
  const sttProvider = (env.SPEECH_STT_PROVIDER ?? 'openai') as string;
  const ttsProvider = (env.SPEECH_TTS_PROVIDER ?? 'elevenlabs') as string;
  const dbProvider = (env.NEXT_PUBLIC_DB_PROVIDER ?? 'localStorage') as string;
  const voiceProvider = (env.NEXT_PUBLIC_VOICE_PROVIDER ?? 'native') as string;

  // --- Critical: required API keys for current config ---
  if (chatProvider === 'anthropic') {
    if (hasValue(env.ANTHROPIC_API_KEY)) {
      add(items, 'chat_anthropic', 'info', 'Chat provider: Anthropic', 'ANTHROPIC_API_KEY set');
    } else {
      add(items, 'chat_anthropic', 'critical', 'ANTHROPIC_API_KEY not set', 'Required for SPEECH_CHAT_PROVIDER=anthropic');
    }
  } else if (chatProvider === 'openai') {
    if (hasValue(env.OPENAI_API_KEY)) {
      add(items, 'chat_openai', 'info', 'Chat provider: OpenAI', 'OPENAI_API_KEY set');
    } else {
      add(items, 'chat_openai', 'critical', 'OPENAI_API_KEY not set', 'Required for SPEECH_CHAT_PROVIDER=openai');
    }
  } else {
    if (hasValue(env.GEMINI_API_KEY)) {
      add(items, 'chat_gemini', 'info', 'Chat provider: Gemini', 'GEMINI_API_KEY set');
    } else {
      add(items, 'chat_gemini', 'critical', 'GEMINI_API_KEY not set', 'Required for SPEECH_CHAT_PROVIDER=gemini');
    }
  }

  if (sttProvider === 'openai') {
    if (hasValue(env.OPENAI_API_KEY)) {
      add(items, 'stt_openai', 'info', 'STT provider: OpenAI', 'OPENAI_API_KEY set');
    } else {
      add(items, 'stt_openai', 'critical', 'OPENAI_API_KEY not set', 'Required for SPEECH_STT_PROVIDER=openai');
    }
  } else {
    if (hasValue(env.GEMINI_API_KEY)) {
      add(items, 'stt_gemini', 'info', 'STT provider: Gemini', 'GEMINI_API_KEY set');
    } else {
      add(items, 'stt_gemini', 'critical', 'GEMINI_API_KEY not set', 'Required for SPEECH_STT_PROVIDER=gemini');
    }
  }

  if (ttsProvider === 'elevenlabs') {
    if (hasValue(env.ELEVENLABS_API_KEY)) {
      add(items, 'tts_elevenlabs', 'info', 'TTS provider: ElevenLabs', 'ELEVENLABS_API_KEY set');
    } else {
      add(items, 'tts_elevenlabs', 'critical', 'ELEVENLABS_API_KEY not set', 'Required for SPEECH_TTS_PROVIDER=elevenlabs');
    }
  } else if (ttsProvider === 'openai') {
    if (hasValue(env.OPENAI_API_KEY)) {
      add(items, 'tts_openai', 'info', 'TTS provider: OpenAI', 'OPENAI_API_KEY set');
    } else {
      add(items, 'tts_openai', 'critical', 'OPENAI_API_KEY not set', 'Required for SPEECH_TTS_PROVIDER=openai');
    }
  } else {
    if (hasValue(env.GEMINI_API_KEY)) {
      add(items, 'tts_gemini', 'info', 'TTS provider: Gemini', 'GEMINI_API_KEY set');
    } else {
      add(items, 'tts_gemini', 'critical', 'GEMINI_API_KEY not set', 'Required for SPEECH_TTS_PROVIDER=gemini');
    }
  }

  if (dbProvider === 'supabase') {
    if (hasValue(env.NEXT_PUBLIC_SUPABASE_URL) && hasValue(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      add(items, 'db_supabase', 'info', 'DB provider: Supabase', 'URL and anon key set');
    } else {
      add(items, 'db_supabase', 'critical', 'Supabase URL or anon key not set', 'Required for NEXT_PUBLIC_DB_PROVIDER=supabase');
    }
  } else if (dbProvider === 'convex') {
    if (hasValue(env.NEXT_PUBLIC_CONVEX_URL)) {
      add(items, 'db_convex', 'info', 'DB provider: Convex', 'NEXT_PUBLIC_CONVEX_URL set');
    } else {
      add(items, 'db_convex', 'critical', 'NEXT_PUBLIC_CONVEX_URL not set', 'Required for NEXT_PUBLIC_DB_PROVIDER=convex');
    }
  } else {
    add(items, 'db_local', 'info', 'DB provider: localStorage', 'No backend required');
  }

  if (voiceProvider === 'vapi') {
    if (hasValue(env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) && hasValue(env.NEXT_PUBLIC_VAPI_ASSISTANT_ID)) {
      add(items, 'voice_vapi', 'info', 'Voice provider: Vapi', 'Key and assistant ID set');
    } else {
      add(items, 'voice_vapi', 'critical', 'Vapi key or assistant ID not set', 'Required for NEXT_PUBLIC_VOICE_PROVIDER=vapi');
    }
  } else if (voiceProvider === 'gemini-live') {
    if (hasValue(env.GEMINI_API_KEY)) {
      add(items, 'voice_gemini_live', 'info', 'Voice provider: Gemini Live', 'GEMINI_API_KEY set for token endpoint');
    } else {
      add(items, 'voice_gemini_live', 'critical', 'GEMINI_API_KEY not set', 'Required for NEXT_PUBLIC_VOICE_PROVIDER=gemini-live');
    }
  } else {
    add(items, 'voice_native', 'info', 'Voice provider: native', 'Uses /api/talk');
  }

  const critical = items.filter((i) => i.level === 'critical').length;
  const error = items.filter((i) => i.level === 'error').length;
  const info = items.filter((i) => i.level === 'info').length;

  const result: HealthResult = {
    ok: critical === 0 && error === 0,
    critical,
    error,
    info,
    items,
  };
  cachedResult = result;
  return result;
}

export function formatSummary(result: HealthResult): string {
  if (result.ok) return 'OK';
  const parts: string[] = [];
  if (result.critical > 0) parts.push(`${result.critical} critical`);
  if (result.error > 0) parts.push(`${result.error} error(s)`);
  return parts.join(', ');
}
