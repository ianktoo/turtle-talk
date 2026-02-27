/**
 * SMS service factory.
 *
 * Set SMS_PROVIDER env var to select a provider.
 * Currently supported: 'plivo' (default).
 *
 * Usage:
 *   import { getSMS } from '@/lib/sms';
 *   await getSMS().send({ to: '+12125551234', from: '+15551234567', body: 'Hello!' });
 */
import type { SMSService } from './types';

export type { SMSService, SMSMessage, SMSSendResult } from './types';

let _instance: SMSService | null = null;

export function getSMS(): SMSService {
  if (_instance) return _instance;

  const provider = process.env.SMS_PROVIDER ?? 'plivo';

  if (provider === 'plivo') {
    const { PlivoSMSProvider } = require('./providers/plivo');
    _instance = new PlivoSMSProvider();
  } else {
    throw new Error(`Unknown SMS provider: "${provider}". Supported: plivo`);
  }

  return _instance!;
}
