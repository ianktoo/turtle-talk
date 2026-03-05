/** @jest-environment node */
/** Tests for POST /api/livekit/token */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/livekit/token/route';

const originalEnv = process.env;

describe('POST /api/livekit/token', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns 503 when LIVEKIT_API_KEY or LIVEKIT_API_SECRET is unset', async () => {
    process.env.LIVEKIT_API_KEY = '';
    process.env.LIVEKIT_API_SECRET = 'secret';
    process.env.LIVEKIT_URL = 'wss://test.livekit.cloud';

    const req = new NextRequest('http://localhost/api/livekit/token', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('LIVEKIT_API_KEY');
  });

  it('returns 503 when LIVEKIT_API_SECRET is unset', async () => {
    process.env.LIVEKIT_API_KEY = 'key';
    process.env.LIVEKIT_API_SECRET = '';
    process.env.LIVEKIT_URL = 'wss://test.livekit.cloud';

    const req = new NextRequest('http://localhost/api/livekit/token', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.error).toContain('LIVEKIT_API_SECRET');
  });

  it('returns 200 with token, roomName, livekitUrl when env is set', async () => {
    process.env.LIVEKIT_API_KEY = 'APItestkey';
    process.env.LIVEKIT_API_SECRET = 'testsecret';
    process.env.LIVEKIT_URL = 'wss://test.livekit.cloud';

    const req = new NextRequest('http://localhost/api/livekit/token', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toMatchObject({
      roomName: expect.stringMatching(/^talk-\d+-[a-z0-9]+$/),
      livekitUrl: 'wss://test.livekit.cloud',
    });
    expect(typeof data.token).toBe('string');
    expect(data.token.length).toBeGreaterThan(0);
  });

  it('uses body roomName and participantName when provided', async () => {
    process.env.LIVEKIT_API_KEY = 'APItestkey';
    process.env.LIVEKIT_API_SECRET = 'testsecret';
    process.env.LIVEKIT_URL = 'wss://test.livekit.cloud';

    const req = new NextRequest('http://localhost/api/livekit/token', {
      method: 'POST',
      body: JSON.stringify({ roomName: 'talk-Max', participantName: 'child' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.roomName).toBe('talk-Max');
    expect(data.token).toBeDefined();
    expect(data.livekitUrl).toBe('wss://test.livekit.cloud');
  });
});
