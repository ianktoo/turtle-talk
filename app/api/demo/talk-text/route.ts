import { NextRequest } from 'next/server';
import { SpeechService } from '@/lib/speech/SpeechService';
import { OpenAISTTProvider, GeminiSTTProvider } from '@/lib/speech/providers/stt';
import { ElevenLabsTTSProvider, GeminiTTSProvider } from '@/lib/speech/providers/tts';
import { createChatProvider } from '@/lib/speech/providers/chat';
import { ChildSafeGuardrail } from '@/lib/speech/guardrails/ChildSafeGuardrail';
import type { ConversationContext } from '@/lib/speech/types';
import { speechConfig } from '@/lib/speech/config';

export const maxDuration = 30;

type DemoTalkTextRequest = {
  userText: string;
  context?: Partial<ConversationContext> & { messages?: unknown };
};

export async function POST(req: NextRequest) {
  let body: DemoTalkTextRequest;
  try {
    body = (await req.json()) as DemoTalkTextRequest;
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const userText = typeof body?.userText === 'string' ? body.userText.trim() : '';
  if (!userText) return Response.json({ error: 'Missing userText' }, { status: 400 });

  const contextRaw = body?.context ?? {};
  const messages = Array.isArray(contextRaw.messages) ? (contextRaw.messages as ConversationContext['messages']).slice(-20) : [];
  const childName =
    typeof contextRaw.childName === 'string' && contextRaw.childName.trim()
      ? contextRaw.childName.trim()
      : undefined;
  const topics = Array.isArray(contextRaw.topics) ? contextRaw.topics : [];
  const difficultyProfileRaw = contextRaw.difficultyProfile;
  const difficultyProfile: ConversationContext['difficultyProfile'] =
    difficultyProfileRaw === 'beginner' ||
    difficultyProfileRaw === 'intermediate' ||
    difficultyProfileRaw === 'confident'
      ? difficultyProfileRaw
      : 'beginner';
  const activeMission = contextRaw.activeMission ?? null;

  const context: ConversationContext = {
    messages,
    childName,
    topics,
    difficultyProfile,
    activeMission,
  };

  // NOTE: We intentionally do text-only here (no streaming, no TTS) so demo typing
  // can work even if audio providers are unavailable.
  const stt = speechConfig.stt.provider === 'gemini' ? new GeminiSTTProvider() : new OpenAISTTProvider();
  const tts = speechConfig.tts.provider === 'gemini' ? new GeminiTTSProvider() : new ElevenLabsTTSProvider();
  const chat = createChatProvider(speechConfig.chat.provider);
  const guardrail = new ChildSafeGuardrail();
  const service = new SpeechService({ stt, tts, chat, guardrails: [guardrail] });

  const emptyAudio = new Blob([], { type: 'audio/webm' });
  const result = await service.processToText(emptyAudio, context, { preTranscribedText: userText });

  return Response.json({
    userText: result.userText,
    responseText: result.responseText,
    mood: result.mood,
    missionChoices: result.missionChoices ?? undefined,
    endConversation: result.endConversation ?? undefined,
    childName: result.childName ?? undefined,
    topic: result.topic ?? undefined,
    missionProgressNote: result.missionProgressNote ?? undefined,
  });
}

