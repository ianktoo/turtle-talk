import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import type { TTSProvider } from '../types';
import { speechConfig } from '../config';

export class ElevenLabsTTSProvider implements TTSProvider {
  private client: ElevenLabsClient;

  constructor(apiKey?: string) {
    this.client = new ElevenLabsClient({
      apiKey: apiKey ?? process.env.ELEVENLABS_API_KEY,
    });
  }

  async synthesize(text: string): Promise<ArrayBuffer> {
    const stream = await this.client.textToSpeech.convert(speechConfig.tts.voiceId, {
      text,
      modelId: speechConfig.tts.model,
      outputFormat: speechConfig.tts.outputFormat,
      languageCode: speechConfig.tts.languageCode,
      voiceSettings: speechConfig.tts.voiceSettings,
    });

    const reader = stream.getReader();
    const chunks: Buffer[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks).buffer;
  }
}
