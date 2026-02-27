'use client';

import type { Message, MissionSuggestion, TurtleMood } from '../types';
import type { VoiceSessionOptions, VoiceSessionState } from './types';
import { BaseVoiceProvider } from './base';

const VAD_THRESHOLD = 35;      // ambient noise sits at 8-20, real speech at 40+
const VAD_START_MS = 150;      // silence must turn to sound for this long
const VAD_STOP_MS = 600;       // sound must drop below threshold for this long
const POLL_INTERVAL_MS = 100;
const MIN_AUDIO_BYTES = 6000;  // ~400 ms of real speech

export class NativeVoiceProvider extends BaseVoiceProvider {
  readonly name = 'native';

  private stream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  private state: VoiceSessionState = 'idle';
  private prevState: VoiceSessionState = 'idle';
  private messages: Message[] = [];
  private pendingEnd = false;
  private options: VoiceSessionOptions = {};

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async start(options: VoiceSessionOptions): Promise<void> {
    this.options = options;
    if (options.initialMessages?.length) {
      this.messages = [...options.initialMessages];
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      this.emit('error', 'Could not access microphone');
      return;
    }

    this.audioCtx = new AudioContext();
    const source = this.audioCtx.createMediaStreamSource(this.stream);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    this.setState('listening');
    this.emit('moodChange', 'listening');
    this.startVAD();
  }

  stop(): void {
    this.cleanup();
    this.setState('ended');
    this.emit('moodChange', 'idle');
    this.emit('end');
  }

  setMuted(muted: boolean): void {
    if (muted) {
      this.prevState = this.state;
      this.audioCtx?.suspend();
      this.setState('muted');
      this.emit('moodChange', 'idle');
    } else {
      this.audioCtx?.resume();
      const restore = this.prevState === 'muted' ? 'listening' : this.prevState;
      this.setState(restore);
      this.emit('moodChange', 'listening');
    }
  }

  // ---------------------------------------------------------------------------
  // VAD loop
  // ---------------------------------------------------------------------------

  private startVAD(): void {
    const dataArr = new Uint8Array(this.analyser!.frequencyBinCount);
    let aboveThresholdSince: number | null = null;
    let belowThresholdSince: number | null = null;

    this.pollInterval = setInterval(() => {
      const s = this.state;
      if (s === 'ended' || s === 'muted' || s === 'processing' || s === 'speaking') return;

      this.analyser!.getByteFrequencyData(dataArr);
      const avg = dataArr.reduce((a, b) => a + b, 0) / dataArr.length;

      if (s === 'listening') {
        if (avg > VAD_THRESHOLD) {
          aboveThresholdSince ??= Date.now();
          if (Date.now() - aboveThresholdSince >= VAD_START_MS) {
            aboveThresholdSince = null;
            belowThresholdSince = null;
            this.startRecording();
          }
        } else {
          aboveThresholdSince = null;
        }
      } else if (s === 'recording') {
        if (avg < VAD_THRESHOLD) {
          belowThresholdSince ??= Date.now();
          if (Date.now() - belowThresholdSince >= VAD_STOP_MS) {
            belowThresholdSince = null;
            aboveThresholdSince = null;
            this.stopRecording();
          }
        } else {
          belowThresholdSince = null;
        }
      }
    }, POLL_INTERVAL_MS);
  }

  private startRecording(): void {
    if (!this.stream) return;
    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream);
    this.recorder.start();
    this.setState('recording');
    this.emit('moodChange', 'listening');
  }

  private stopRecording(): void {
    const recorder = this.recorder;
    if (!recorder || recorder.state === 'inactive') return;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    recorder.onstop = () => {
      const mimeType = recorder.mimeType || 'audio/webm';
      const blob = new Blob(this.chunks, { type: mimeType });
      this.chunks = [];
      this.sendAudio(blob);
    };
    recorder.stop();
  }

  // ---------------------------------------------------------------------------
  // API call
  // ---------------------------------------------------------------------------

  private async sendAudio(blob: Blob): Promise<void> {
    if (blob.size < MIN_AUDIO_BYTES) {
      this.setState('listening');
      this.emit('moodChange', 'listening');
      return;
    }

    this.setState('processing');
    this.emit('moodChange', 'confused');

    const opts = this.options;
    const formData = new FormData();
    formData.append('audio', blob, 'audio.webm');
    formData.append('messages', JSON.stringify(this.messages));
    if (opts.childName) formData.append('childName', opts.childName);
    if (opts.topics?.length) formData.append('topics', JSON.stringify(opts.topics));
    if (opts.difficultyProfile) formData.append('difficultyProfile', opts.difficultyProfile);
    if (opts.activeMission) formData.append('activeMission', JSON.stringify(opts.activeMission));

    try {
      const res = await fetch('/api/talk', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let receivedMeta = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as Record<string, unknown>;

          if (event.type === 'meta') {
            receivedMeta = true;
            const { userText, responseText, mood, missionChoices, endConversation, childName, topic } =
              event as {
                userText: string; responseText: string; mood: TurtleMood;
                missionChoices?: MissionSuggestion[]; endConversation?: boolean;
                childName?: string; topic?: string;
              };

            if (missionChoices) this.emit('missionChoices', missionChoices);
            if (endConversation) this.pendingEnd = true;
            if (childName) this.emit('childName', childName);
            if (topic) this.emit('topic', topic);

            const updated: Message[] = [
              ...this.messages,
              { role: 'user', content: userText },
              { role: 'assistant', content: responseText },
            ];
            this.messages = updated;
            this.emit('messages', updated);

            this.setState('speaking');
            this.emit('moodChange', mood ?? 'talking');

          } else if (event.type === 'audio') {
            await this.playAudio(event.base64 as string);
          } else if (event.type === 'error') {
            throw new Error(event.error as string);
          }
        }
      }

      // Stream closed without meta — discard silently, return to listening
      if (!receivedMeta && this.state === 'processing') {
        this.setState('listening');
        this.emit('moodChange', 'listening');
      }
    } catch (err) {
      this.emit('error', err instanceof Error ? err.message : 'Something went wrong');
      this.setState('listening');
      this.emit('moodChange', 'listening');
    }
  }

  // ---------------------------------------------------------------------------
  // Audio playback
  // ---------------------------------------------------------------------------

  private async playAudio(base64: string): Promise<void> {
    return new Promise((resolve) => {
      const audioData = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const playCtx = new AudioContext();
      playCtx.decodeAudioData(audioData.buffer).then((decoded) => {
        const source = playCtx.createBufferSource();
        source.buffer = decoded;
        source.connect(playCtx.destination);
        source.start();
        source.onended = () => {
          playCtx.close();
          if (this.pendingEnd) {
            this.pendingEnd = false;
            this.stop();
          } else if (this.state !== 'ended' && this.state !== 'muted') {
            this.setState('listening');
            this.emit('moodChange', 'listening');
          }
          resolve();
        };
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  private cleanup(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.audioCtx?.close();
    this.audioCtx = null;
  }

  private setState(s: VoiceSessionState): void {
    this.state = s;
    this.emit('stateChange', s);
  }
}
