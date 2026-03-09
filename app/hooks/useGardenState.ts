'use client';

import { useState, useEffect, useCallback } from 'react';

export interface GardenStateWishOption {
  id: string;
  label: string;
  theme_slug: string;
  selected_by_child: boolean;
}

export interface GardenStateRound {
  id: string;
  status: string;
  created_at: string;
}

export interface GardenStateData {
  missionsCompletedInCycle: number;
  lastGrowthAt: string | null;
  activeWishRound: GardenStateRound | null;
  options: GardenStateWishOption[];
}

const defaultState: GardenStateData = {
  missionsCompletedInCycle: 0,
  lastGrowthAt: null,
  activeWishRound: null,
  options: [],
};

export function useGardenState(enabled: boolean) {
  const [data, setData] = useState<GardenStateData>(defaultState);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!enabled) {
      setData(defaultState);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/garden/state', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) {
        setData(defaultState);
        return;
      }
      setData({
        missionsCompletedInCycle: json.missionsCompletedInCycle ?? 0,
        lastGrowthAt: json.lastGrowthAt ?? null,
        activeWishRound: json.activeWishRound ?? null,
        options: json.options ?? [],
      });
    } catch (e) {
      console.error('[useGardenState]', e);
      setData(defaultState);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...data, isLoading, refetch };
}
