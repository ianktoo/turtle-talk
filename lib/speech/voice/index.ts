export type { VoiceConversationProvider, VoiceSessionState, VoiceSessionOptions, VoiceEventMap } from './types';
export { BaseVoiceProvider } from './base';
export { NativeVoiceProvider } from './native';
export { VapiVoiceProvider } from './vapi';

/** Read NEXT_PUBLIC_VOICE_PROVIDER (default: 'native') and return the right provider instance.
 *  Call this inside a useEffect or 'use client' context — both providers use browser APIs. */
export function createVoiceProvider(
  name?: string,
): import('./types').VoiceConversationProvider {
  const provider = name ?? process.env.NEXT_PUBLIC_VOICE_PROVIDER ?? 'native';
  if (provider === 'vapi') {
    const { VapiVoiceProvider } = require('./vapi') as typeof import('./vapi');
    return new VapiVoiceProvider();
  }
  const { NativeVoiceProvider } = require('./native') as typeof import('./native');
  return new NativeVoiceProvider();
}
