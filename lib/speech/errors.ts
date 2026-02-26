export type SpeechStage = 'stt' | 'input-guardrail' | 'chat' | 'output-guardrail' | 'tts';

export class SpeechServiceError extends Error {
  constructor(
    message: string,
    public readonly stage: SpeechStage,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'SpeechServiceError';
  }
}

export class GuardrailBlockedError extends Error {
  constructor(
    public readonly stage: 'input' | 'output',
    public readonly reason: string,
    public readonly guardrailName: string,
  ) {
    super(`Guardrail "${guardrailName}" blocked ${stage}: ${reason}`);
    this.name = 'GuardrailBlockedError';
  }
}
