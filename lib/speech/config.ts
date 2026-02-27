/**
 * Central config for all speech service models and settings.
 * Every value can be overridden with an environment variable — see .env.local.
 */
export const speechConfig = {
  stt: {
    model: process.env.SPEECH_STT_MODEL ?? 'gpt-4o-mini-transcribe',
  },
  tts: {
    voiceId: process.env.ELEVENLABS_VOICE_ID ?? '9BWtsMINqrJLrRacOk9x', // Aria
    model: process.env.ELEVENLABS_MODEL ?? 'eleven_turbo_v2_5',
    outputFormat: 'mp3_44100_128' as const,
  },
  chat: {
    provider: (process.env.SPEECH_CHAT_PROVIDER ?? 'anthropic') as 'anthropic' | 'openai',
    anthropicModel: process.env.SPEECH_ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
    openaiModel: process.env.SPEECH_OPENAI_MODEL ?? 'gpt-4o-mini',
    maxTokens: parseInt(process.env.SPEECH_CHAT_MAX_TOKENS ?? '256', 10),
  },
} as const;
