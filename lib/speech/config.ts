/**
 * Central config for all speech service models and settings.
 * Every value can be overridden with an environment variable — see .env.local.
 *
 * Voice provider selection:
 *   NEXT_PUBLIC_VOICE_PROVIDER=native  (default) — VAD + MediaRecorder + /api/talk
 *   NEXT_PUBLIC_VOICE_PROVIDER=vapi   — Vapi WebRTC + /api/vapi/llm
 *
 * STT provider:
 *   SPEECH_STT_PROVIDER=openai   (default) — OpenAI Whisper / gpt-4o-mini-transcribe
 *   SPEECH_STT_PROVIDER=gemini   — Gemini Flash Lite audio input
 *
 * TTS provider:
 *   SPEECH_TTS_PROVIDER=elevenlabs  (default) — ElevenLabs Sarah voice
 *   SPEECH_TTS_PROVIDER=gemini      — Gemini Flash TTS (Aoede voice)
 *
 * Model overrides (all optional):
 *   SPEECH_STT_MODEL            — OpenAI STT model
 *   SPEECH_GEMINI_STT_MODEL     — Gemini STT model
 *   SPEECH_GEMINI_TTS_MODEL     — Gemini TTS model
 *   SPEECH_GEMINI_TTS_VOICE     — Gemini TTS voice name
 *   ELEVENLABS_VOICE_ID         — ElevenLabs voice ID
 *   ELEVENLABS_MODEL            — ElevenLabs model
 *   SPEECH_ANTHROPIC_MODEL      — Anthropic chat model
 *   SPEECH_OPENAI_MODEL         — OpenAI chat model
 *   SPEECH_CHAT_MAX_TOKENS      — max tokens for chat responses
 */
export const speechConfig = {
  /** Which voice conversation provider to use. */
  voiceProvider: (process.env.NEXT_PUBLIC_VOICE_PROVIDER ?? 'native') as 'native' | 'vapi',

  stt: {
    provider: (process.env.SPEECH_STT_PROVIDER ?? 'openai') as 'openai' | 'gemini',
    // OpenAI STT model
    model: process.env.SPEECH_STT_MODEL ?? 'gpt-4o-mini-transcribe',
    // Gemini STT model
    geminiModel: process.env.SPEECH_GEMINI_STT_MODEL ?? 'gemini-2.0-flash-lite',
  },

  tts: {
    provider: (process.env.SPEECH_TTS_PROVIDER ?? 'elevenlabs') as 'elevenlabs' | 'gemini',
    // ElevenLabs settings
    voiceId: process.env.ELEVENLABS_VOICE_ID ?? 'EXAVITQu4vr4xnSDxMaL', // Sarah — warm storyteller
    model: process.env.ELEVENLABS_MODEL ?? 'eleven_turbo_v2_5',
    outputFormat: 'mp3_44100_128' as const,
    languageCode: 'en',
    voiceSettings: {
      stability: 0.75,       // high = consistent, predictable voice across turns
      similarityBoost: 0.75, // adhere closely to Sarah's reference voice
      style: 0,              // no style exaggeration — keeps tone steady
      speed: 0.9,            // slightly slower for kids aged 4-10
    },
    // Gemini TTS settings
    geminiModel: process.env.SPEECH_GEMINI_TTS_MODEL ?? 'gemini-2.5-flash-preview-tts',
    geminiVoice: process.env.SPEECH_GEMINI_TTS_VOICE ?? 'Aoede',
  },

  chat: {
    provider: (process.env.SPEECH_CHAT_PROVIDER ?? 'anthropic') as 'anthropic' | 'openai',
    anthropicModel: process.env.SPEECH_ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
    openaiModel: process.env.SPEECH_OPENAI_MODEL ?? 'gpt-4o-mini',
    maxTokens: parseInt(process.env.SPEECH_CHAT_MAX_TOKENS ?? '512', 10),
  },
} as const;
