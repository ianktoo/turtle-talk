import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import type { STTProvider } from '../types';

export class OpenAISTTProvider implements STTProvider {
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({ apiKey: apiKey ?? process.env.OPENAI_API_KEY });
  }

  async transcribe(audio: Blob): Promise<string> {
    const arrayBuffer = await audio.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const file = await toFile(buffer, 'audio.webm', { type: audio.type || 'audio/webm' });

    const transcription = await this.client.audio.transcriptions.create({
      file,
      model: 'whisper-1',
    });

    return transcription.text;
  }
}
