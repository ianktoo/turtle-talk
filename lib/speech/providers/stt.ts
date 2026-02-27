import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import type { STTProvider } from '../types';
import { speechConfig } from '../config';

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

    const transcription = await this.client.audio.transcriptions.create({
      file,
      model: speechConfig.stt.model,
    });

    return transcription.text;
  }
}
