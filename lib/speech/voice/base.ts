import type { VoiceEventMap, VoiceEventHandler, VoiceConversationProvider, VoiceSessionOptions } from './types';

/** Shared event-emitter bookkeeping. Extend this rather than implementing
 *  VoiceConversationProvider directly. */
export abstract class BaseVoiceProvider implements VoiceConversationProvider {
  abstract readonly name: string;
  abstract start(options: VoiceSessionOptions): Promise<void>;
  abstract stop(): void;
  abstract setMuted(muted: boolean): void;

  // Internal storage uses unknown[] to avoid complex intersection types;
  // the public on/off/emit API remains fully typed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _handlers: Partial<Record<keyof VoiceEventMap, any[]>> = {};

  on<E extends keyof VoiceEventMap>(event: E, handler: VoiceEventHandler<E>): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list: any[] = this._handlers[event] ?? [];
    list.push(handler);
    this._handlers[event] = list;
  }

  off<E extends keyof VoiceEventMap>(event: E, handler: VoiceEventHandler<E>): void {
    const list = this._handlers[event];
    if (list) this._handlers[event] = list.filter((h) => h !== handler);
  }

  protected emit<E extends keyof VoiceEventMap>(
    event: E,
    ...args: VoiceEventMap[E] extends void ? [] : [VoiceEventMap[E]]
  ): void {
    const list = this._handlers[event];
    if (!list) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const h of list) (h as (...a: any[]) => void)(...args);
  }
}
