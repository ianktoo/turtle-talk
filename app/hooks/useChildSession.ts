'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ChildSession {
  childId: string;
  firstName: string;
  emoji: string;
}

/**
 * Fetches current child session from cookie (GET /api/child-session).
 * Use the returned childId for useMissions(childId) and usePersonalMemory(childId)
 * when the child has logged in with code + name + emoji.
 */
export function useChildSession(): {
  child: ChildSession | null;
  isLoading: boolean;
  refetch: () => void;
} {
  const [child, setChild] = useState<ChildSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/child-session', { credentials: 'include' });
      const data = await res.json();
      setChild(data.child ?? null);
    } catch {
      setChild(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { child, isLoading, refetch };
}
