/**
 * @jest-environment node
 * Tests for GET /api/child-session
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/child-session/route';

const getChildSessionCookieName = jest.fn(() => 'child_session');
const parseChildSessionCookieValue = jest.fn();

jest.mock('@/lib/child-session', () => ({
  getChildSessionCookieName,
  parseChildSessionCookieValue,
}));

describe('GET /api/child-session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns child: null when no cookie', async () => {
    const req = new NextRequest('http://localhost/api/child-session');
    parseChildSessionCookieValue.mockReturnValue(null);

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ child: null });
    expect(parseChildSessionCookieValue).toHaveBeenCalledWith(undefined);
  });

  it('returns child: null when cookie is invalid', async () => {
    const req = new NextRequest('http://localhost/api/child-session', {
      headers: { Cookie: 'child_session=invalid' },
    });
    parseChildSessionCookieValue.mockReturnValue(null);

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ child: null });
  });

  it('returns child object when cookie is valid', async () => {
    const session = { childId: 'cid-1', firstName: 'Sam', emoji: '🐢' };
    parseChildSessionCookieValue.mockReturnValue(session);

    const req = new NextRequest('http://localhost/api/child-session', {
      headers: { Cookie: 'child_session=valid-token' },
    });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.child).toEqual({
      childId: 'cid-1',
      firstName: 'Sam',
      emoji: '🐢',
    });
  });

  it('returns child: null on parse error', async () => {
    parseChildSessionCookieValue.mockImplementation(() => {
      throw new Error('bad');
    });
    const req = new NextRequest('http://localhost/api/child-session', {
      headers: { Cookie: 'child_session=bad' },
    });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toEqual({ child: null });
  });
});
