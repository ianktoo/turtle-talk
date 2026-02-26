import { NextRequest, NextResponse } from 'next/server';
import { SpeechService } from '@/lib/speech/SpeechService';
import { OpenAISTTProvider } from '@/lib/speech/providers/stt';
import { OpenAITTSProvider } from '@/lib/speech/providers/tts';
import { createChatProvider } from '@/lib/speech/providers/chat';
import { ChildSafeGuardrail } from '@/lib/speech/guardrails/ChildSafeGuardrail';
import type { ConversationContext, Message } from '@/lib/speech/types';
import { SpeechServiceError } from '@/lib/speech/errors';
import { speechConfig } from '@/lib/speech/config';

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const audioFile = formData.get('audio');
  const messagesRaw = formData.get('messages');

  if (!audioFile || !(audioFile instanceof Blob)) {
    return NextResponse.json({ error: 'Missing audio field' }, { status: 400 });
  }

  let messages: Message[] = [];
  if (messagesRaw && typeof messagesRaw === 'string') {
    try {
      messages = JSON.parse(messagesRaw);
    } catch {
      return NextResponse.json({ error: 'Invalid messages JSON' }, { status: 400 });
    }
  }

  const context: ConversationContext = { messages };

  try {
    const stt = new OpenAISTTProvider();
    const tts = new OpenAITTSProvider();
    const chat = createChatProvider(speechConfig.chat.provider);
    const guardrail = new ChildSafeGuardrail();

    const service = new SpeechService({ stt, tts, chat, guardrails: [guardrail] });
    const result = await service.process(audioFile, context);

    const base64Audio = Buffer.from(result.responseAudio).toString('base64');

    return NextResponse.json({
      userText: result.userText,
      responseText: result.responseText,
      responseAudioBase64: base64Audio,
      mood: result.mood,
      mission: result.mission ?? null,
    });
  } catch (err) {
    const isDev = process.env.NODE_ENV === 'development';

    if (err instanceof SpeechServiceError) {
      console.error(`[talk/route] SpeechServiceError stage="${err.stage}":`, err.message, err.cause);
      const detail = isDev ? ` (stage: ${err.stage}, cause: ${String(err.cause)})` : '';
      return NextResponse.json(
        { error: `Speech processing failed.${detail}` },
        { status: 500 },
      );
    }

    console.error('[talk/route] Unexpected error:', err);
    const detail = isDev ? ` (${err instanceof Error ? err.message : String(err)})` : '';
    return NextResponse.json({ error: `Something went wrong.${detail}` }, { status: 500 });
  }
}
