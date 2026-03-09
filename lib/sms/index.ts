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
import { createLazySingleton, pickProvider } from '@/lib/utils/singleton';

export type { SMSService, SMSMessage, SMSSendResult } from './types';

const SMS_PROVIDERS = ['plivo'] as const;
type SmsProvider = (typeof SMS_PROVIDERS)[number];

export const getSMS = createLazySingleton((): SMSService => {
  const provider = pickProvider<SmsProvider>(
    'SMS_PROVIDER',
    process.env.SMS_PROVIDER,
    SMS_PROVIDERS,
    'plivo',
  );

  if (provider === 'plivo') {
    const { PlivoSMSProvider } = require('./providers/plivo');
    return new PlivoSMSProvider();
  }

  // pickProvider already throws for unknown values; this is unreachable but
  // satisfies the exhaustive type check.
  throw new Error(`Unhandled SMS provider: ${provider}`);
});
