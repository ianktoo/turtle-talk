'use client';

import { Room, RoomEvent, Track } from 'livekit-client';
import type { VoiceSessionOptions } from './types';
import { BaseVoiceProvider } from './base';

/**
 * LiveKitVoiceProvider
 *
 * Connects to a LiveKit room with a token from /api/livekit/token. The room is
 * joined by a LiveKit agent (see livekit-agent/) that runs the pipeline:
 * Google Cloud STT (Chirp) → Gemini LLM → Gemini TTS.
 */
export class LiveKitVoiceProvider extends BaseVoiceProvider {
  readonly name = 'livekit';

  private room: Room | null = null;
  private _generation = 0;
  private _muted = false;
  private audioEl: HTMLAudioElement | null = null;

  async start(options: VoiceSessionOptions): Promise<void> {
    const gen = ++this._generation;
    this.emit('stateChange', 'listening');
    this.emit('moodChange', 'listening');

    try {
      const tokenRes = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: options.childName ? `talk-${options.childName}` : undefined,
          participantName: 'child',
        }),
      });
      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        throw new Error(err?.error ?? `Token failed: ${tokenRes.status}`);
      }
      const data = (await tokenRes.json()) as { token?: string; roomName?: string; livekitUrl?: string };
      const { token, roomName, livekitUrl } = data;
      if (!token || !livekitUrl?.trim()) throw new Error('Missing token or livekitUrl');

      if (this._generation !== gen) return;

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: { simulcast: false },
      });

      room.on(RoomEvent.Disconnected, () => {
        if (this._generation !== gen) return;
        this.room = null;
        this.audioEl = null;
        this.emit('stateChange', 'idle');
        this.emit('moodChange', 'idle');
        this.emit('end');
      });

      room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
        if (this._generation !== gen) return;
        try {
          const text = new TextDecoder().decode(payload);
          const parsed = JSON.parse(text) as { type?: string; text?: string };
          if (parsed.type === 'transcript' && typeof parsed.text === 'string') {
            this.emit('userTranscript', parsed.text);
          }
        } catch {
          // ignore non-JSON or other data
        }
      });

      room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
        if (this._generation !== gen || track.kind !== Track.Kind.Audio) return;
        // In a voice-agent room, the only remote audio is the agent
        this.emit('stateChange', 'speaking');
        this.emit('moodChange', 'talking');
        const el = track.attach();
        this.audioEl = el;
        el.autoplay = true;
        document.body.appendChild(el);
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        if (track.kind === Track.Kind.Audio && this.audioEl) {
          this.audioEl.remove();
          this.audioEl = null;
        }
        if (this._generation === gen) {
          this.emit('stateChange', 'listening');
          this.emit('moodChange', 'listening');
        }
      });

      await room.connect(livekitUrl, token, { autoSubscribe: true });

      if (this._generation !== gen) {
        room.disconnect();
        return;
      }

      this.room = room;

      const localTrack = await room.localParticipant.enableMicrophone(true);
      if (localTrack && this._muted) localTrack.mute();
    } catch (err) {
      if (this._generation !== gen) return;
      const msg = err instanceof Error ? err.message : 'Failed to connect to LiveKit';
      this.emit('error', msg);
      this.emit('stateChange', 'idle');
      this.emit('moodChange', 'idle');
    }
  }

  stop(): void {
    this._generation++;
    if (this.audioEl?.parentNode) this.audioEl.remove();
    this.audioEl = null;
    this.room?.disconnect();
    this.room = null;
    this.emit('stateChange', 'ended');
    this.emit('end');
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
    if (this.room?.localParticipant?.audioTrackPublications) {
      this.room.localParticipant.audioTrackPublications.forEach((pub) => {
        if (pub.track) pub.track.mute(muted);
      });
    }
  }
}
