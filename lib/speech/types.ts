import type { GuardrailAgent } from './guardrails/types';

export type MissionTheme = 'brave' | 'kind' | 'calm' | 'confident' | 'creative' | 'social' | 'curious';

export interface Mission {
  id: string;
  title: string;
  description: string;
  theme: MissionTheme;
  status: 'active' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export type TurtleMood =
  | 'idle'
  | 'listening'
  | 'talking'
  | 'happy'
  | 'sad'
  | 'confused'
  | 'surprised';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationContext {
  messages: Message[];
  childName?: string;
}

export interface STTProvider {
  transcribe(audio: Blob): Promise<string>;
}

export interface TTSProvider {
  synthesize(text: string): Promise<ArrayBuffer>;
}

export interface MissionSuggestion {
  title: string;
  description: string;
  theme: MissionTheme;
}

export interface ChatResponse {
  text: string;
  mood: TurtleMood;
  mission?: MissionSuggestion;
  endConversation?: boolean;
}

export interface ChatProvider {
  chat(input: string, ctx: ConversationContext): Promise<ChatResponse>;
}

export interface SpeechServiceConfig {
  stt: STTProvider;
  tts: TTSProvider;
  chat: ChatProvider;
  guardrails?: GuardrailAgent[];
}

/** Result of STT + guardrails + chat — no audio yet */
export interface TextProcessResult {
  userText: string;
  responseText: string;
  mood: TurtleMood;
  mission?: MissionSuggestion;
  endConversation?: boolean;
}

export interface ProcessResult extends TextProcessResult {
  responseAudio: ArrayBuffer;
}
