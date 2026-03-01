/**
 * @jest-environment node
 * Tests for POST /api/child-logout
 */
import { POST } from '@/app/api/child-logout/route';

const getChildSessionCookieName = jest.fn(() => 'child_session');

jest.mock('@/lib/child-session', () => ({
  getChildSessionCookieName,
}));

describe('POST /api/child-logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 with ok: true and clears cookie', async () => {
    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ ok: true });
    expect(getChildSessionCookieName).toHaveBeenCalled();
  });
});
