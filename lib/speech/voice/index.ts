export type { VoiceConversationProvider, VoiceSessionState, VoiceSessionOptions, VoiceEventMap } from './types';
export { BaseVoiceProvider } from './base';
export { NativeVoiceProvider } from './native';
export { VapiVoiceProvider } from './vapi';
export { GeminiLiveVoiceProvider } from './gemini-live';
export { LiveKitVoiceProvider } from './livekit';
export { OpenAIRealtimeVoiceProvider } from './openai-realtime';

/** Read NEXT_PUBLIC_VOICE_PROVIDER (default: 'livekit') and return the right provider instance.
 *  Call this inside a useEffect or 'use client' context — both providers use browser APIs. */
export function createVoiceProvider(
  name?: string,
): import('./types').VoiceConversationProvider {
  const provider = name ?? process.env.NEXT_PUBLIC_VOICE_PROVIDER ?? 'livekit';
  if (provider === 'vapi') {
    const { VapiVoiceProvider } = require('./vapi') as typeof import('./vapi');
    return new VapiVoiceProvider();
  }
  if (provider === 'gemini-live') {
    const { GeminiLiveVoiceProvider } = require('./gemini-live') as typeof import('./gemini-live');
    return new GeminiLiveVoiceProvider();
  }
  if (provider === 'livekit') {
    const { LiveKitVoiceProvider } = require('./livekit') as typeof import('./livekit');
    return new LiveKitVoiceProvider();
  }
  if (provider === 'openai-realtime') {
    const { OpenAIRealtimeVoiceProvider } = require('./openai-realtime') as typeof import('./openai-realtime');
    return new OpenAIRealtimeVoiceProvider();
  }
  const { NativeVoiceProvider } = require('./native') as typeof import('./native');
  return new NativeVoiceProvider();
}
