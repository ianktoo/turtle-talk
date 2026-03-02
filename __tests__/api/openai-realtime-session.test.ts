/** @jest-environment node */
import { POST } from '@/app/api/openai-realtime/session/route';
import { NextRequest } from 'next/server';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.OPENAI_API_KEY = 'sk-test';
});

afterEach(() => {
  delete process.env.OPENAI_API_KEY;
});

test('returns 503 when OPENAI_API_KEY is missing', async () => {
  delete process.env.OPENAI_API_KEY;
  const req = new NextRequest('http://localhost/api/openai-realtime/session', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const res = await POST(req);
  expect(res.status).toBe(503);
  const body = await res.json();
  expect(body.error).toMatch(/OPENAI_API_KEY/);
});

test('calls OpenAI /v1/realtime/sessions with API key', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ client_secret: { value: 'eph-key' } }),
  });
  const req = new NextRequest('http://localhost/api/openai-realtime/session', {
    method: 'POST',
    body: JSON.stringify({ model: 'gpt-4o-mini-realtime-preview', voice: 'sage' }),
  });
  await POST(req);
  expect(mockFetch).toHaveBeenCalledWith(
    'https://api.openai.com/v1/realtime/sessions',
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer sk-test' }),
    })
  );
});

test('returns OpenAI session data on success', async () => {
  const sessionData = { client_secret: { value: 'eph-key-123' } };
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => sessionData });
  const req = new NextRequest('http://localhost/api/openai-realtime/session', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const res = await POST(req);
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.client_secret.value).toBe('eph-key-123');
});

test('returns 502 when OpenAI returns an error', async () => {
  mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'quota exceeded' }), status: 429 });
  const req = new NextRequest('http://localhost/api/openai-realtime/session', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const res = await POST(req);
  expect(res.status).toBe(502);
});
