'use client';

import { useState, useEffect, useCallback } from 'react';

export interface WishRoundHonoredOption {
  id: string;
  label: string;
}

export interface WishRound {
  id: string;
  status: string;
  created_at: string;
  honoredOption?: WishRoundHonoredOption;
}

export interface WishRoundOption {
  id: string;
  label: string;
  theme_slug: string;
  selected_by_child: boolean;
}

export interface UseWishRoundsResult {
  rounds: WishRound[];
  activeRoundOptions: WishRoundOption[] | undefined;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export function useWishRounds(): UseWishRoundsResult {
  const [rounds, setRounds] = useState<WishRound[]>([]);
  const [activeRoundOptions, setActiveRoundOptions] = useState<WishRoundOption[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/wishes/rounds', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        // Treat missing/expired child session as a soft, guest state instead of an error.
        // (Message text can vary; the status is the stable signal.)
        if (res.status === 401) {
          setRounds([]);
          setActiveRoundOptions(undefined);
          return;
        }
        throw new Error(data.error ?? 'Failed to load rounds');
      }
      setRounds(data.rounds ?? []);
      setActiveRoundOptions(data.activeRoundOptions);
    } catch (e) {
      console.error('[useWishRounds]', e);
      setRounds([]);
      setActiveRoundOptions(undefined);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { rounds, activeRoundOptions, isLoading, refetch };
}
