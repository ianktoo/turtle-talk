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
 * Required env vars: NEXT_PUBLIC_VAPI_PUBLIC_KEY, NEXT_PUBLIC_VAPI_ASSISTANT_ID
 * Optional env var:  NEXT_PUBLIC_CUSTOM_LLM_URL (set to ngrok URL for local dev)
 */
export class VapiVoiceProvider extends BaseVoiceProvider {
  readonly name = 'vapi';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private vapi: any = null;
  private messages: Message[] = [];
  // Generation counter: incremented on every start/stop so stale call-end events
  // from old Vapi SDK instances (e.g. React Strict Mode double-invoke) are ignored.
  private _generation = 0;

  async start(options: VoiceSessionOptions): Promise<void> {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) {
      this.emit('error', 'NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set');
      return;
    }

    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    if (!assistantId) {
      this.emit('error', 'NEXT_PUBLIC_VAPI_ASSISTANT_ID is not set');
      return;
    }

    if (options.initialMessages?.length) {
      this.messages = [...options.initialMessages];
    }

    // Dynamic import keeps @vapi-ai/web out of the server bundle
    const gen = ++this._generation;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vapiModule = await import('@vapi-ai/web') as any;
      // If stop() was called while we were waiting for the import (React Strict Mode
      // double-invoke, fast unmount, etc.), bail out — don't create a second SDK instance.
      if (this._generation !== gen) return;
      // Handle both real ESM (vapiModule.default = Vapi) and CJS interop in Jest tests
      // (vapiModule.default.default = Vapi when mock lacks __esModule: true).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Vapi: new (key: string) => any = vapiModule.default?.default ?? vapiModule.default;
      this.vapi = new Vapi(publicKey);
      this.bindVapiEvents(gen);

      const llmBase =
        process.env.NEXT_PUBLIC_CUSTOM_LLM_URL ||
        (typeof window !== 'undefined' ? window.location.origin : '');

      await this.vapi.start({
        assistantId,
        assistantOverrides: {
          model: {
            provider: 'custom-llm',
            model: 'shelly',
            url: `${llmBase}/api/vapi/llm`,
            metadataSendMode: 'variable',
          },
          voice: {
            provider: '11labs',
            voiceId: process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID ?? 'EXAVITQu4vr4xnSDxMaL',
            model: 'eleven_turbo_v2_5',
            stability: 0.75,
            similarityBoost: 0.75,
            speed: 0.9,
          },
          variableValues: {
            childName: options.childName ?? 'friend',
          },
        },
        // top-level metadata — Vapi forwards this to /api/vapi/llm as body.metadata
        metadata: {
          childName: options.childName ?? null,
          topics: options.topics ?? [],
          difficultyProfile: options.difficultyProfile ?? 'beginner',
          activeMission: options.activeMission ?? null,
        },
      });
    } catch (err) {
      this.emit('error', (err as Error)?.message ?? 'Failed to start Vapi');
    }
  }

  stop(): void {
    this._generation++; // invalidate all handlers from the current session
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
  private bindVapiEvents(gen: number): void {
    const v = this.vapi;
    // Guard: if _generation has advanced past this session's gen, the event is stale
    const alive = () => this._generation === gen;

    v.on('call-start', () => {
      if (!alive()) return;
      this.emit('stateChange', 'listening');
      this.emit('moodChange', 'listening');
    });

    v.on('call-end', () => {
      if (!alive()) return;
      this.emit('stateChange', 'ended');
      this.emit('moodChange', 'idle');
      this.emit('end');
    });

    // User began speaking
    v.on('speech-start', () => {
      if (!alive()) return;
      this.emit('stateChange', 'recording');
      this.emit('moodChange', 'listening');
    });

    // User finished speaking — Vapi will now call our LLM
    v.on('speech-end', () => {
      if (!alive()) return;
      this.emit('stateChange', 'processing');
      this.emit('moodChange', 'confused');
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    v.on('message', (message: any) => {
      if (!alive()) return;
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
      if (!alive()) return;
      this.emit('error', (e as Error)?.message ?? 'Vapi error');
    });
  }
}
