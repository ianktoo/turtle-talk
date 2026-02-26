import { ChildSafeGuardrail } from '@/lib/speech/guardrails/ChildSafeGuardrail';

describe('ChildSafeGuardrail', () => {
  let guardrail: ChildSafeGuardrail;

  beforeEach(() => {
    guardrail = new ChildSafeGuardrail();
  });

  describe('checkInput', () => {
    it('passes safe content', async () => {
      const result = await guardrail.checkInput('What is your favourite ocean creature?');
      expect(result.safe).toBe(true);
    });

    it('passes normal child speech', async () => {
      const result = await guardrail.checkInput('I like turtles and fish!');
      expect(result.safe).toBe(true);
    });

    it('blocks violence keyword "kill"', async () => {
      const result = await guardrail.checkInput('I want to kill everyone');
      expect(result.safe).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('blocks profanity', async () => {
      const result = await guardrail.checkInput('that was such a shit idea');
      expect(result.safe).toBe(false);
    });

    it('blocks adult content', async () => {
      const result = await guardrail.checkInput('show me porn');
      expect(result.safe).toBe(false);
    });

    it('blocks self-harm references', async () => {
      const result = await guardrail.checkInput('I want to hurt myself');
      expect(result.safe).toBe(false);
    });

    it('blocks substance references', async () => {
      const result = await guardrail.checkInput('give me some alcohol');
      expect(result.safe).toBe(false);
    });

    it('is case-insensitive', async () => {
      const result = await guardrail.checkInput('KILL the bad guy');
      expect(result.safe).toBe(false);
    });
  });

  describe('checkOutput', () => {
    it('passes safe short output', async () => {
      const result = await guardrail.checkOutput('I love swimming in the ocean!');
      expect(result.safe).toBe(true);
      expect(result.sanitized).toBeUndefined();
    });

    it('blocks unsafe content in output', async () => {
      const result = await guardrail.checkOutput('You should drink alcohol');
      expect(result.safe).toBe(false);
    });

    it('sanitizes output that is too long (>500 chars)', async () => {
      const longText = 'A'.repeat(600);
      const result = await guardrail.checkOutput(longText);
      expect(result.safe).toBe(true);
      expect(result.sanitized).toBeDefined();
      expect(result.sanitized!.length).toBeLessThanOrEqual(503); // 500 + '...'
    });

    it('passes output that is exactly 500 chars', async () => {
      const text = 'B'.repeat(500);
      const result = await guardrail.checkOutput(text);
      expect(result.safe).toBe(true);
      expect(result.sanitized).toBeUndefined();
    });

    it('includes reason when blocking output', async () => {
      const result = await guardrail.checkOutput('use a gun to solve problems');
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('gun');
    });
  });

  describe('name', () => {
    it('has correct name', () => {
      expect(guardrail.name).toBe('ChildSafeGuardrail');
    });
  });
});
