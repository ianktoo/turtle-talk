import type { SpeechServiceConfig, ConversationContext, ProcessResult, TextProcessResult, TurtleMood, ChatResponse } from './types';
import type { GuardrailAgent } from './guardrails/types';
import { SpeechServiceError, GuardrailBlockedError } from './errors';

const FALLBACK_RESPONSE = "Oh my! Let's talk about something else. What's your favourite animal?";
const FALLBACK_MOOD: TurtleMood = 'confused';

export class SpeechService {
  private stt: SpeechServiceConfig['stt'];
  private tts: SpeechServiceConfig['tts'];
  private chat: SpeechServiceConfig['chat'];
  private guardrails: GuardrailAgent[];

  constructor(config: SpeechServiceConfig) {
    this.stt = config.stt;
    this.tts = config.tts;
    this.chat = config.chat;
    this.guardrails = config.guardrails ? [...config.guardrails] : [];
  }

  addGuardrail(agent: GuardrailAgent): void {
    this.guardrails.push(agent);
  }

  removeGuardrail(name: string): void {
    this.guardrails = this.guardrails.filter((g) => g.name !== name);
  }

  private async runInputGuardrails(text: string): Promise<void> {
    for (const guardrail of this.guardrails) {
      let result;
      try {
        result = await guardrail.checkInput(text);
      } catch (err) {
        throw new SpeechServiceError(
          `Guardrail "${guardrail.name}" threw during input check`,
          'input-guardrail',
          err,
        );
      }
      if (!result.safe) {
        throw new GuardrailBlockedError('input', result.reason ?? 'unsafe content', guardrail.name);
      }
    }
  }

  private async runOutputGuardrails(text: string): Promise<string> {
    let current = text;
    for (const guardrail of this.guardrails) {
      let result;
      try {
        result = await guardrail.checkOutput(current);
      } catch (err) {
        throw new SpeechServiceError(
          `Guardrail "${guardrail.name}" threw during output check`,
          'output-guardrail',
          err,
        );
      }
      if (!result.safe) {
        throw new GuardrailBlockedError('output', result.reason ?? 'unsafe content', guardrail.name);
      }
      if (result.sanitized) {
        current = result.sanitized;
      }
    }
    return current;
  }

  /** Steps 1–4: STT → input guardrails → chat → output guardrails. No TTS. */
  async processToText(audio: Blob, context: ConversationContext): Promise<TextProcessResult> {
    // 1. STT
    let userText: string;
    try {
      userText = await this.stt.transcribe(audio);
    } catch (err) {
      throw new SpeechServiceError('Speech-to-text failed', 'stt', err);
    }

    // 2. Input guardrails
    try {
      await this.runInputGuardrails(userText);
    } catch (err) {
      if (err instanceof GuardrailBlockedError) {
        return { userText, responseText: FALLBACK_RESPONSE, mood: FALLBACK_MOOD };
      }
      throw err;
    }

    // 3. Chat
    let chatResponse: ChatResponse;
    try {
      chatResponse = await this.chat.chat(userText, context);
    } catch (err) {
      throw new SpeechServiceError('Chat provider failed', 'chat', err);
    }

    // 4. Output guardrails
    let safeResponseText: string;
    try {
      safeResponseText = await this.runOutputGuardrails(chatResponse.text);
    } catch (err) {
      if (err instanceof GuardrailBlockedError) {
        return { userText, responseText: FALLBACK_RESPONSE, mood: FALLBACK_MOOD };
      }
      throw err;
    }

    return {
      userText,
      responseText: safeResponseText,
      mood: chatResponse.mood,
      mission: chatResponse.mission,
      endConversation: chatResponse.endConversation,
    };
  }

  async process(audio: Blob, context: ConversationContext): Promise<ProcessResult> {
    // 1. STT
    let userText: string;
    try {
      userText = await this.stt.transcribe(audio);
    } catch (err) {
      throw new SpeechServiceError('Speech-to-text failed', 'stt', err);
    }

    // 2. Input guardrails
    try {
      await this.runInputGuardrails(userText);
    } catch (err) {
      if (err instanceof GuardrailBlockedError) {
        // Safe fallback for blocked input
        const responseAudio = await this.synthesizeSafe(FALLBACK_RESPONSE);
        return { userText, responseText: FALLBACK_RESPONSE, responseAudio, mood: FALLBACK_MOOD };
      }
      throw err;
    }

    // 3. Chat
    let chatResponse: ChatResponse;
    try {
      chatResponse = await this.chat.chat(userText, context);
    } catch (err) {
      throw new SpeechServiceError('Chat provider failed', 'chat', err);
    }

    // 4. Output guardrails
    let safeResponseText: string;
    try {
      safeResponseText = await this.runOutputGuardrails(chatResponse.text);
    } catch (err) {
      if (err instanceof GuardrailBlockedError) {
        const responseAudio = await this.synthesizeSafe(FALLBACK_RESPONSE);
        return { userText, responseText: FALLBACK_RESPONSE, responseAudio, mood: FALLBACK_MOOD };
      }
      throw err;
    }

    // 5. TTS
    const responseAudio = await this.synthesizeSafe(safeResponseText);

    return {
      userText,
      responseText: safeResponseText,
      responseAudio,
      mood: chatResponse.mood,
      mission: chatResponse.mission,
      endConversation: chatResponse.endConversation,
    };
  }

  private async synthesizeSafe(text: string): Promise<ArrayBuffer> {
    try {
      return await this.tts.synthesize(text);
    } catch (err) {
      throw new SpeechServiceError('Text-to-speech failed', 'tts', err);
    }
  }
}
