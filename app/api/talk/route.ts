import { NextRequest } from 'next/server';
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
    return Response.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const audioFile = formData.get('audio');
  const messagesRaw = formData.get('messages');

  if (!audioFile || !(audioFile instanceof Blob)) {
    return Response.json({ error: 'Missing audio field' }, { status: 400 });
  }

  let messages: Message[] = [];
  if (messagesRaw && typeof messagesRaw === 'string') {
    try {
      messages = JSON.parse(messagesRaw);
    } catch {
      return Response.json({ error: 'Invalid messages JSON' }, { status: 400 });
    }
  }

  const context: ConversationContext = { messages };

  const stt = new OpenAISTTProvider();
  const tts = new OpenAITTSProvider();
  const chat = createChatProvider(speechConfig.chat.provider);
  const guardrail = new ChildSafeGuardrail();
  const service = new SpeechService({ stt, tts, chat, guardrails: [guardrail] });

  const encoder = new TextEncoder();
  const isDev = process.env.NODE_ENV === 'development';

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));

      try {
        // Phase 1: STT + guardrails + chat (no TTS yet)
        // Mood and text arrive here — client can update the turtle face immediately.
        const textResult = await service.processToText(audioFile, context);
        send({ type: 'meta', ...textResult });

        // Phase 2: TTS — runs while client already has the mood/text
        const audioBuffer = await tts.synthesize(textResult.responseText);
        const base64 = Buffer.from(audioBuffer).toString('base64');
        send({ type: 'audio', base64 });
      } catch (err) {
        let error = 'Something went wrong.';
        if (err instanceof SpeechServiceError) {
          console.error(`[talk/route] SpeechServiceError stage="${err.stage}":`, err.message, err.cause);
          error = isDev ? `Speech processing failed. (stage: ${err.stage})` : 'Speech processing failed.';
        } else {
          console.error('[talk/route] Unexpected error:', err);
          if (isDev && err instanceof Error) error = err.message;
        }
        send({ type: 'error', error });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson' },
  });
}
