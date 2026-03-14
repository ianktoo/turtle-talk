/** @jest-environment node */
/** Tests for GET /api/wishes/rounds */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/wishes/rounds/route';

jest.mock('@/lib/child-session', () => ({
  getChildSessionCookieName: jest.fn(() => 'turtle-talk-child-session'),
  parseChildSessionCookieValue: jest.fn(),
}));

const childSession = require('@/lib/child-session') as {
  getChildSessionCookieName: jest.Mock;
  parseChildSessionCookieValue: jest.Mock;
};

describe('GET /api/wishes/rounds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 Child session required when no childId in session', async () => {
    const req = new NextRequest('http://localhost/api/wishes/rounds');
    childSession.parseChildSessionCookieValue.mockReturnValue(null);

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data).toEqual({ error: 'Child session required' });
  });
});

