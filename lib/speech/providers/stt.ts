import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { STTProvider } from '../types';
import { speechConfig } from '../config';
import { debugLog } from '../debug-log';

// ---------------------------------------------------------------------------
// OpenAI STT (Whisper / gpt-4o-mini-transcribe)
// ---------------------------------------------------------------------------

export class OpenAISTTProvider implements STTProvider {
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({ apiKey: apiKey ?? process.env.OPENAI_API_KEY });
  }

  async transcribe(audio: Blob): Promise<string> {
    const arrayBuffer = await audio.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = audio.type || 'audio/webm';
    const ext = mimeType.startsWith('audio/ogg') ? 'ogg'
      : mimeType.startsWith('audio/mp4') ? 'mp4'
      : mimeType.startsWith('audio/wav') ? 'wav'
      : 'webm';
    const file = await toFile(buffer, `audio.${ext}`, { type: mimeType });
    // #region agent log
    debugLog({ location: 'lib/speech/providers/stt.ts:OpenAI_before', message: 'OpenAI STT input', data: { blobSize: buffer.length, mimeType }, hypothesisId: 'H3' });
    // #endregion

    const transcription = await this.client.audio.transcriptions.create({
      file,
      model: speechConfig.stt.model,
      language: 'en', // force English — prevents Whisper from auto-detecting wrong language
    });

    const text = transcription.text ?? '';
    // #region agent log
    debugLog({ location: 'lib/speech/providers/stt.ts:OpenAI_after', message: 'OpenAI STT output', data: { textLen: text.length, textSnippet: text.slice(0, 80) }, hypothesisId: 'H1,H4' });
    // #endregion
    return text;
  }
}

// ---------------------------------------------------------------------------
// Gemini STT  (gemini-2.0-flash-lite with inline audio input)
// ---------------------------------------------------------------------------

export class GeminiSTTProvider implements STTProvider {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey?: string) {
    this.genAI = new GoogleGenerativeAI(apiKey ?? process.env.GEMINI_API_KEY ?? '');
  }

  /** True if the error looks like a transient 503 / high demand from Gemini. */
  private static isRetryable503(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err);
    return (
      msg.includes('503') ||
      msg.includes('Service Unavailable') ||
      msg.includes('high demand') ||
      msg.includes('temporary')
    );
  }

  async transcribe(audio: Blob): Promise<string> {
    const arrayBuffer = await audio.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = (audio.type || 'audio/webm') as string;
    // #region agent log
    debugLog({ location: 'lib/speech/providers/stt.ts:Gemini_before', message: 'Gemini STT input', data: { blobSize: arrayBuffer.byteLength, mimeType }, hypothesisId: 'H3' });
    // #endregion

    const model = this.genAI.getGenerativeModel({ model: speechConfig.stt.geminiModel });
    const prompt =
      'Transcribe the English speech in this audio clip. Return only the spoken words with no punctuation corrections, labels, or commentary. If there is no speech or only silence, return an empty string.';

    const readText = (result: Awaited<ReturnType<typeof model.generateContent>>): string => {
      try {
        const t = result.response.text();
        return (t ?? '').trim();
      } catch (e) {
        // #region agent log
        debugLog({ location: 'lib/speech/providers/stt.ts:Gemini_no_text', message: 'Gemini response.text() failed', data: { message: e instanceof Error ? e.message : String(e) }, hypothesisId: 'H4' });
        // #endregion
        return '';
      }
    };

    try {
      const result = await model.generateContent([
        { inlineData: { mimeType, data: base64 } },
        prompt,
      ]);
      const text = readText(result);
      // #region agent log
      debugLog({ location: 'lib/speech/providers/stt.ts:Gemini_after', message: 'Gemini STT output', data: { textLen: text.length, textSnippet: text.slice(0, 80) }, hypothesisId: 'H1,H4' });
      // #endregion
      return text;
    } catch (firstErr) {
      if (!GeminiSTTProvider.isRetryable503(firstErr)) throw firstErr;
      await new Promise((r) => setTimeout(r, 1500));
      const result = await model.generateContent([
        { inlineData: { mimeType, data: base64 } },
        prompt,
      ]);
      const text = readText(result);
      // #region agent log
      debugLog({ location: 'lib/speech/providers/stt.ts:Gemini_after_retry', message: 'Gemini STT output after retry', data: { textLen: text.length, textSnippet: text.slice(0, 80) }, hypothesisId: 'H1,H4' });
      // #endregion
      return text;
    }
  }
}
