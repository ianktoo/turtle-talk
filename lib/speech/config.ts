/**
 * Central config for all speech service models and settings.
 * Every value can be overridden with an environment variable — see .env.local.
 */
export const speechConfig = {
  stt: {
    model: process.env.SPEECH_STT_MODEL ?? 'gpt-4o-mini-transcribe',
  },
  tts: {
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
  },
  chat: {
    provider: (process.env.SPEECH_CHAT_PROVIDER ?? 'anthropic') as 'anthropic' | 'openai',
    anthropicModel: process.env.SPEECH_ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
    openaiModel: process.env.SPEECH_OPENAI_MODEL ?? 'gpt-4o-mini',
    maxTokens: parseInt(process.env.SPEECH_CHAT_MAX_TOKENS ?? '256', 10),
  },
} as const;
