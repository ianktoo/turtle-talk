/**
 * Central config for all speech service models and settings.
 * Every value can be overridden with an environment variable — see .env.local.
 */
export const speechConfig = {
  stt: {
    model: process.env.SPEECH_STT_MODEL ?? 'gpt-4o-mini-transcribe',
  },
  tts: {
    model: process.env.SPEECH_TTS_MODEL ?? 'gpt-4o-mini-tts',
    voice: process.env.SPEECH_TTS_VOICE ?? 'coral',
    instructions:
      process.env.SPEECH_TTS_INSTRUCTIONS ??
      'You are Shelly, a warm and gentle sea turtle. Speak slowly and clearly with a calm, nurturing tone — playful and encouraging, as if talking to a young child aged 4 to 10.',
  },
  chat: {
    provider: (process.env.SPEECH_CHAT_PROVIDER ?? 'anthropic') as 'anthropic' | 'openai',
    anthropicModel: process.env.SPEECH_ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
    openaiModel: process.env.SPEECH_OPENAI_MODEL ?? 'gpt-4o-mini',
    maxTokens: parseInt(process.env.SPEECH_CHAT_MAX_TOKENS ?? '256', 10),
  },
} as const;
