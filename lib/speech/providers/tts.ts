import OpenAI from 'openai';
import type { TTSProvider } from '../types';

export class OpenAITTSProvider implements TTSProvider {
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({ apiKey: apiKey ?? process.env.OPENAI_API_KEY });
  }

  async synthesize(text: string): Promise<ArrayBuffer> {
    const response = await this.client.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: text,
      response_format: 'mp3',
    });

    return response.arrayBuffer();
  }
}
