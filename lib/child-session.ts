/**
 * Child session cookie: signed payload so client cannot forge childId.
 * Server-only: use in API routes and server components.
 */
import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'turtle-talk-child-session';
const MAX_AGE_DAYS = 7;

export interface ChildSessionPayload {
  childId: string;
  firstName: string;
  emoji: string;
  exp: number;
}

function getSecret(): string | null {
  const secret = process.env.CHILD_SESSION_SECRET;
  if (!secret || secret.length < 16) return null;
  return secret;
}

function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64url');
}

function base64UrlDecode(str: string): Buffer {
  return Buffer.from(str, 'base64url');
}

function sign(payload: string): string {
  const secret = getSecret();
  if (!secret) throw new Error('CHILD_SESSION_SECRET not set');
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  return base64UrlEncode(hmac.digest());
}

function verify(payload: string, signature: string): boolean {
  const secret = getSecret();
  if (!secret) return false;
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const expected = base64UrlEncode(hmac.digest());
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch {
    return false;
  }
}

export function getChildSessionCookieName(): string {
  return COOKIE_NAME;
}

export function createChildSessionCookieValue(
  childId: string,
  firstName: string,
  emoji: string
): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_DAYS * 24 * 60 * 60;
  const payload: Omit<ChildSessionPayload, 'exp'> & { exp: number } = {
    childId,
    firstName,
    emoji,
    exp,
  };
  const payloadStr = base64UrlEncode(Buffer.from(JSON.stringify(payload)));
  const signature = sign(payloadStr);
  return `${payloadStr}.${signature}`;
}

export function parseChildSessionCookieValue(
  value: string | undefined
): ChildSessionPayload | null {
  if (!value || !value.includes('.')) return null;
  const [payloadStr, signature] = value.split('.');
  if (!payloadStr || !signature || !verify(payloadStr, signature))
    return null;
  try {
    const payload = JSON.parse(
      base64UrlDecode(payloadStr).toString('utf8')
    ) as ChildSessionPayload;
    if (
      typeof payload.childId !== 'string' ||
      typeof payload.exp !== 'number' ||
      payload.exp < Date.now() / 1000
    )
      return null;
    return payload;
  } catch {
    return null;
  }
}

export function getChildSessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  maxAge: number;
  path: string;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE_DAYS * 24 * 60 * 60,
    path: '/',
  };
}
