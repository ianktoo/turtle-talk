export interface GuardrailResult {
  safe: boolean;
  reason?: string;
  sanitized?: string;
}

export interface GuardrailAgent {
  name: string;
  checkInput(text: string): Promise<GuardrailResult>;
  checkOutput(text: string): Promise<GuardrailResult>;
}
