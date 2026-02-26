import { SpeechService } from '@/lib/speech/SpeechService';
import { SpeechServiceError, GuardrailBlockedError } from '@/lib/speech/errors';
import type { STTProvider, TTSProvider, ChatProvider, ConversationContext } from '@/lib/speech/types';
import type { GuardrailAgent, GuardrailResult } from '@/lib/speech/guardrails/types';

function makeSTT(text = 'Hello Shelly'): jest.Mocked<STTProvider> {
  return { transcribe: jest.fn().mockResolvedValue(text) };
}

function makeTTS(): jest.Mocked<TTSProvider> {
  return { synthesize: jest.fn().mockResolvedValue(new ArrayBuffer(8)) };
}

function makeChat(text = 'Hi there!', mood = 'happy'): jest.Mocked<ChatProvider> {
  return { chat: jest.fn().mockResolvedValue({ text, mood }) };
}

function makeGuardrail(safe = true, name = 'TestGuardrail'): jest.Mocked<GuardrailAgent> {
  const result: GuardrailResult = safe ? { safe: true } : { safe: false, reason: 'blocked' };
  return {
    name,
    checkInput: jest.fn().mockResolvedValue(result),
    checkOutput: jest.fn().mockResolvedValue(result),
  };
}

const ctx: ConversationContext = { messages: [] };

describe('SpeechService', () => {
  it('calls STT, chat, and TTS in order', async () => {
    const stt = makeSTT();
    const chat = makeChat();
    const tts = makeTTS();
    const service = new SpeechService({ stt, tts, chat });

    const result = await service.process(new Blob(['audio']), ctx);

    expect(stt.transcribe).toHaveBeenCalledTimes(1);
    expect(chat.chat).toHaveBeenCalledWith('Hello Shelly', ctx);
    expect(tts.synthesize).toHaveBeenCalledWith('Hi there!');
    expect(result.userText).toBe('Hello Shelly');
    expect(result.responseText).toBe('Hi there!');
    expect(result.mood).toBe('happy');
    expect(result.responseAudio).toBeInstanceOf(ArrayBuffer);
  });

  it('runs guardrail checks during processing', async () => {
    const stt = makeSTT();
    const chat = makeChat();
    const tts = makeTTS();
    const guardrail = makeGuardrail(true);

    const service = new SpeechService({ stt, tts, chat, guardrails: [guardrail] });
    await service.process(new Blob(['audio']), ctx);

    expect(guardrail.checkInput).toHaveBeenCalledWith('Hello Shelly');
    expect(guardrail.checkOutput).toHaveBeenCalledWith('Hi there!');
  });

  it('returns fallback response when input guardrail blocks', async () => {
    const stt = makeSTT('kill everyone');
    const chat = makeChat();
    const tts = makeTTS();
    const guardrail = makeGuardrail(false);

    const service = new SpeechService({ stt, tts, chat, guardrails: [guardrail] });
    const result = await service.process(new Blob(['audio']), ctx);

    expect(chat.chat).not.toHaveBeenCalled();
    expect(result.mood).toBe('confused');
    expect(result.responseText).toContain("Let's talk about something else");
  });

  it('returns fallback response when output guardrail blocks', async () => {
    const stt = makeSTT();
    const chat = makeChat('bad output');
    const tts = makeTTS();

    const inputSafe = makeGuardrail(true, 'Input');
    const outputBlocker: jest.Mocked<GuardrailAgent> = {
      name: 'OutputBlocker',
      checkInput: jest.fn().mockResolvedValue({ safe: true }),
      checkOutput: jest.fn().mockResolvedValue({ safe: false, reason: 'bad' }),
    };

    const service = new SpeechService({ stt, tts, chat, guardrails: [inputSafe, outputBlocker] });
    const result = await service.process(new Blob(['audio']), ctx);

    expect(result.mood).toBe('confused');
    expect(result.responseText).toContain("Let's talk about something else");
  });

  it('throws SpeechServiceError with stage=stt when STT fails', async () => {
    const stt = makeSTT();
    stt.transcribe.mockRejectedValue(new Error('STT error'));
    const chat = makeChat();
    const tts = makeTTS();

    const service = new SpeechService({ stt, tts, chat });
    await expect(service.process(new Blob(['audio']), ctx)).rejects.toMatchObject({
      name: 'SpeechServiceError',
      stage: 'stt',
    });
  });

  it('throws SpeechServiceError with stage=chat when chat fails', async () => {
    const stt = makeSTT();
    const chat = makeChat();
    chat.chat.mockRejectedValue(new Error('Chat error'));
    const tts = makeTTS();

    const service = new SpeechService({ stt, tts, chat });
    await expect(service.process(new Blob(['audio']), ctx)).rejects.toMatchObject({
      name: 'SpeechServiceError',
      stage: 'chat',
    });
  });

  it('addGuardrail adds a new guardrail', async () => {
    const stt = makeSTT();
    const chat = makeChat();
    const tts = makeTTS();
    const service = new SpeechService({ stt, tts, chat });

    const guardrail = makeGuardrail(true, 'DynamicGuardrail');
    service.addGuardrail(guardrail);

    await service.process(new Blob(['audio']), ctx);
    expect(guardrail.checkInput).toHaveBeenCalledTimes(1);
  });

  it('removeGuardrail removes a guardrail by name', async () => {
    const stt = makeSTT();
    const chat = makeChat();
    const tts = makeTTS();
    const guardrail = makeGuardrail(true, 'Removable');

    const service = new SpeechService({ stt, tts, chat, guardrails: [guardrail] });
    service.removeGuardrail('Removable');

    await service.process(new Blob(['audio']), ctx);
    expect(guardrail.checkInput).not.toHaveBeenCalled();
  });

  it('sanitizes output when guardrail returns sanitized text', async () => {
    const stt = makeSTT();
    const chat = makeChat('This is a very long response...');
    const tts = makeTTS();

    const sanitizingGuardrail: jest.Mocked<GuardrailAgent> = {
      name: 'Sanitizer',
      checkInput: jest.fn().mockResolvedValue({ safe: true }),
      checkOutput: jest.fn().mockResolvedValue({ safe: true, sanitized: 'Short.' }),
    };

    const service = new SpeechService({ stt, tts, chat, guardrails: [sanitizingGuardrail] });
    const result = await service.process(new Blob(['audio']), ctx);

    expect(tts.synthesize).toHaveBeenCalledWith('Short.');
    expect(result.responseText).toBe('Short.');
  });
});
