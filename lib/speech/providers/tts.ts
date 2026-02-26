import OpenAI from 'openai';
import type { TTSProvider } from '../types';
import { speechConfig } from '../config';

export class OpenAITTSProvider implements TTSProvider {
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({ apiKey: apiKey ?? process.env.OPENAI_API_KEY });
  }

  async synthesize(text: string): Promise<ArrayBuffer> {
    const response = await this.client.audio.speech.create({
      model: speechConfig.tts.model,
      voice: speechConfig.tts.voice as Parameters<typeof this.client.audio.speech.create>[0]['voice'],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(speechConfig.tts.instructions ? { instructions: speechConfig.tts.instructions } as any : {}),
      input: text,
      response_format: 'mp3',
    });

    return response.arrayBuffer();
  }
}
