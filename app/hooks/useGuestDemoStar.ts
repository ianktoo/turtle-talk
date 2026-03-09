'use client';

import { useState, useCallback, useEffect } from 'react';
import { getGuestDemoStar, setGuestDemoStar as saveGuestDemoStar } from '@/lib/db/providers/localStorage';

export function useGuestDemoStar() {
  const [showStar, setShowStarState] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShowStarState(getGuestDemoStar());
    }
  }, []);

  const setShowStar = useCallback((value: boolean) => {
    saveGuestDemoStar(value);
    setShowStarState(value);
  }, []);

  return { showStar, setShowStar };
}
