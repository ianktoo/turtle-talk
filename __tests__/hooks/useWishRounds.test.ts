import { renderHook, waitFor } from '@testing-library/react';
import { useWishRounds } from '@/app/hooks/useWishRounds';

declare const global: any;

describe('useWishRounds', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn();
  });

  it('treats 401 Child session required as guest state without throwing', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Child session required' }),
    });

    const { result } = renderHook(() => useWishRounds());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.rounds).toEqual([]);
    expect(result.current.activeRoundOptions).toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith('/api/wishes/rounds', { credentials: 'include' });
  });

  it('still treats other non-OK responses as errors (logged via catch)', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Failed to load rounds' }),
    });

    const { result } = renderHook(() => useWishRounds());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.rounds).toEqual([]);
    expect(result.current.activeRoundOptions).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

