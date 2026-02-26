import type { GuardrailAgent, GuardrailResult } from './types';

/**
 * LLMGuardrail — stub implementation.
 * Calls an LLM with a classification prompt to deeply evaluate content safety.
 * Wire up a real LLM client here to activate.
 */
export class LLMGuardrail implements GuardrailAgent {
  readonly name = 'LLMGuardrail';

  async checkInput(text: string): Promise<GuardrailResult> {
    // TODO: call LLM with input classification prompt
    // e.g. "Is the following text safe for children aged 4-10? Answer SAFE or UNSAFE with reason."
    void text;
    return { safe: true };
  }

  async checkOutput(text: string): Promise<GuardrailResult> {
    // TODO: call LLM with output classification prompt
    void text;
    return { safe: true };
  }
}
