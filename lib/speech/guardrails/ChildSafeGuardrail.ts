import type { GuardrailAgent, GuardrailResult } from './types';

const BLOCKED_PATTERNS: RegExp[] = [
  // Violence
  /\b(kill|murder|stab|shoot|weapon|gun|knife|bomb|explode|violence|blood|gore)\b/i,
  // Adult content
  /\b(sex|porn|nude|naked|adult|xxx)\b/i,
  // Profanity (common)
  /\b(fuck|shit|damn|ass|bitch|bastard|crap|hell)\b/i,
  // Self-harm
  /\b(suicide|self.?harm|cut myself|hurt myself|die)\b/i,
  // Substances
  /\b(drug|alcohol|beer|wine|vodka|cocaine|marijuana|weed)\b/i,
];

const MAX_OUTPUT_LENGTH = 500;

function containsBlocked(text: string): string | null {
  for (const pattern of BLOCKED_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return null;
}

export class ChildSafeGuardrail implements GuardrailAgent {
  readonly name = 'ChildSafeGuardrail';

  async checkInput(text: string): Promise<GuardrailResult> {
    const blocked = containsBlocked(text);
    if (blocked) {
      return { safe: false, reason: `Blocked term detected: "${blocked}"` };
    }
    return { safe: true };
  }

  async checkOutput(text: string): Promise<GuardrailResult> {
    const blocked = containsBlocked(text);
    if (blocked) {
      return { safe: false, reason: `Output contains blocked term: "${blocked}"` };
    }
    if (text.length > MAX_OUTPUT_LENGTH) {
      const sanitized = text.slice(0, MAX_OUTPUT_LENGTH).trimEnd() + '...';
      return { safe: true, sanitized };
    }
    return { safe: true };
  }
}
