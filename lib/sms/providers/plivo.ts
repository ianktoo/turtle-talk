/**
 * PlivoSMSProvider
 *
 * Sends SMS via the Plivo REST API.
 *
 * Required env vars (server-side only):
 *   PLIVO_AUTH_ID
 *   PLIVO_AUTH_TOKEN
 *   PLIVO_FROM_NUMBER   (default sender — can be overridden per message)
 */
import type { SMSService, SMSMessage, SMSSendResult } from '../types';

const PLIVO_BASE = 'https://api.plivo.com/v1/Account';

export class PlivoSMSProvider implements SMSService {
  private authId: string;
  private authToken: string;

  constructor(authId?: string, authToken?: string) {
    this.authId = authId ?? process.env.PLIVO_AUTH_ID ?? '';
    this.authToken = authToken ?? process.env.PLIVO_AUTH_TOKEN ?? '';

    if (!this.authId || !this.authToken) {
      throw new Error('PlivoSMSProvider: PLIVO_AUTH_ID and PLIVO_AUTH_TOKEN are required');
    }
  }

  async send(message: SMSMessage): Promise<SMSSendResult> {
    const from = message.from || process.env.PLIVO_FROM_NUMBER || '';
    if (!from) throw new Error('PlivoSMSProvider: sender number is required');

    const credentials = Buffer.from(`${this.authId}:${this.authToken}`).toString('base64');
    const url = `${PLIVO_BASE}/${this.authId}/Message/`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        src: from,
        dst: message.to,
        text: message.body,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Plivo API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as { message_uuid: string[]; message: string };
    return {
      messageId: (data.message_uuid ?? [])[0] ?? 'unknown',
      status: data.message ?? 'queued',
    };
  }
}
