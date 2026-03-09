'use client';

import { useState, useEffect, useCallback } from 'react';

export interface WishListItem {
  id: string;
  child_id: string;
  label: string;
  sort_order: number;
  unlocked_at: string | null;
  created_at: string;
}

export type UseWishListOptions = {
  /** When true, fetch /api/wish-list with no childId (child session cookie). Use on child wish-list page only. */
  fetchWhenChildIdNull?: boolean;
};

export function useWishList(childId?: string | null, options?: UseWishListOptions) {
  const { fetchWhenChildIdNull = false } = options ?? {};
  const [items, setItems] = useState<WishListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    const hasChildId = childId != null && childId !== '';
    if (!hasChildId && !fetchWhenChildIdNull) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    const url = hasChildId
      ? `/api/wish-list?childId=${encodeURIComponent(childId)}`
      : '/api/wish-list';
    setIsLoading(true);
    try {
      // #region agent log
      fetch('http://127.0.0.1:7379/ingest/c4e58649-e133-4b9b-91a5-50c962a7060e', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': 'fb5a0a',
        },
        body: JSON.stringify({
          sessionId: 'fb5a0a',
          runId: 'pre-fix',
          hypothesisId: 'H1',
          location: 'app/hooks/useWishList.ts:31',
          message: 'useWishList.refetch.beforeFetch',
          data: {
            url,
            hasChildId,
            fetchWhenChildIdNull,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        // #region agent log
        fetch('http://127.0.0.1:7379/ingest/c4e58649-e133-4b9b-91a5-50c962a7060e', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': 'fb5a0a',
          },
          body: JSON.stringify({
            sessionId: 'fb5a0a',
            runId: 'pre-fix',
            hypothesisId: 'H2',
            location: 'app/hooks/useWishList.ts:38',
            message: 'useWishList.refetch.errorResponse',
            data: {
              status: res.status,
              error: data?.error ?? null,
              url,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        throw new Error(data.error || 'Failed to load wish list');
      }
      setItems(data.items ?? []);
    } catch (e) {
      console.error('[useWishList]', e);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [childId, fetchWhenChildIdNull]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { items, isLoading, refetch };
}
