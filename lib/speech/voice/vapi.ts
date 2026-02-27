'use client';

import type { Message, TurtleMood } from '../types';
import type { VoiceSessionOptions } from './types';
import { BaseVoiceProvider } from './base';

/**
 * VapiVoiceProvider
 *
 * Uses Vapi's WebRTC infrastructure for ultra-low-latency voice.
 * Vapi handles: microphone, VAD, STT (Deepgram), and TTS (ElevenLabs).
 * Our server handles: guardrails + LLM (Claude) via /api/vapi/llm.
 * Mood and mission choices flow back as Vapi function-call events.
 *
 * Required env var: NEXT_PUBLIC_VAPI_PUBLIC_KEY
 */
export class VapiVoiceProvider extends BaseVoiceProvider {
  readonly name = 'vapi';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private vapi: any = null;
  private messages: Message[] = [];

  async start(options: VoiceSessionOptions): Promise<void> {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) {
      this.emit('error', 'NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set');
      return;
    }

    if (options.initialMessages?.length) {
      this.messages = [...options.initialMessages];
    }

    // Dynamic import keeps @vapi-ai/web out of the server bundle
    const { default: Vapi } = await import('@vapi-ai/web');
    this.vapi = new Vapi(publicKey);
    this.bindVapiEvents(options);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    await this.vapi.start({
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en-US',
      },
      model: {
        provider: 'custom-llm',
        model: 'shelly',
        url: `${origin}/api/vapi/llm`,
        // Pass child context so the LLM endpoint can personalise responses
        metadata: {
          childName: options.childName ?? null,
          topics: options.topics ?? [],
          difficultyProfile: options.difficultyProfile ?? 'beginner',
          missionDeclined: options.missionDeclined ?? false,
        },
      },
      voice: {
        provider: 'elevenlabs',
        voiceId: process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID ?? 'EXAVITQu4vr4xnSDxMaL',
        model: 'eleven_turbo_v2_5',
        stability: 0.75,
        similarityBoost: 0.75,
        speed: 0.9,
      },
      name: 'Shelly',
    });
  }

  stop(): void {
    this.vapi?.stop();
    this.vapi = null;
  }

  setMuted(muted: boolean): void {
    if (!this.vapi) return;
    this.vapi.setMuted(muted);
    if (muted) {
      this.emit('stateChange', 'muted');
      this.emit('moodChange', 'idle');
    } else {
      this.emit('stateChange', 'listening');
      this.emit('moodChange', 'listening');
    }
  }

  // ---------------------------------------------------------------------------
  // Vapi event wiring
  // ---------------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private bindVapiEvents(_options: VoiceSessionOptions): void {
    const v = this.vapi;

    v.on('call-start', () => {
      this.emit('stateChange', 'listening');
      this.emit('moodChange', 'listening');
    });

    v.on('call-end', () => {
      this.emit('stateChange', 'ended');
      this.emit('moodChange', 'idle');
      this.emit('end');
    });

    // User began speaking
    v.on('speech-start', () => {
      this.emit('stateChange', 'recording');
      this.emit('moodChange', 'listening');
    });

    // User finished speaking — Vapi will now call our LLM
    v.on('speech-end', () => {
      this.emit('stateChange', 'processing');
      this.emit('moodChange', 'confused');
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    v.on('message', (message: any) => {
      // Final transcript lines → build our messages array
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        const role = message.role as 'user' | 'assistant';
        const content = message.transcript as string;
        const updated: Message[] = [...this.messages, { role, content }];
        this.messages = updated;
        this.emit('messages', updated);

        if (role === 'assistant') {
          this.emit('stateChange', 'speaking');
          this.emit('moodChange', 'talking');
        }
      }

      // Function-call events from our custom LLM endpoint
      // (reportMood, proposeMissions, reportEndConversation)
      if (message.type === 'function-call') {
        const { name, parameters } = (message.functionCall ?? {}) as {
          name?: string; parameters?: Record<string, unknown>;
        };

        if (name === 'reportMood' && parameters?.mood) {
          this.emit('moodChange', parameters.mood as TurtleMood);
        }
        if (name === 'proposeMissions' && Array.isArray(parameters?.choices)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.emit('missionChoices', parameters!.choices as any);
        }
        if (name === 'reportEndConversation') {
          this.stop();
        }
      }

      // Assistant finished speaking → resume listening
      if (message.type === 'status-update' && message.status === 'ended') {
        this.emit('stateChange', 'listening');
        this.emit('moodChange', 'listening');
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    v.on('error', (e: any) => {
      this.emit('error', (e as Error)?.message ?? 'Vapi error');
    });
  }
}
