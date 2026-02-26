'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Mission, MissionSuggestion } from '@/lib/speech/types';

const STORAGE_KEY = 'turtle-talk-missions';

function loadMissions(): Mission[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Mission[]) : [];
  } catch {
    return [];
  }
}

function saveMissions(missions: Mission[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
  } catch {
    // Storage unavailable — silently ignore
  }
}

export function useMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    setMissions(loadMissions());
  }, []);

  const addMission = useCallback((suggestion: MissionSuggestion) => {
    setMissions((prev) => {
      const mission: Mission = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: suggestion.title,
        description: suggestion.description,
        theme: suggestion.theme,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      const updated = [mission, ...prev];
      saveMissions(updated);
      return updated;
    });
  }, []);

  const completeMission = useCallback((id: string) => {
    setMissions((prev) => {
      const updated = prev.map((m) =>
        m.id === id ? { ...m, status: 'completed' as const, completedAt: new Date().toISOString() } : m,
      );
      saveMissions(updated);
      return updated;
    });
  }, []);

  const deleteMission = useCallback((id: string) => {
    setMissions((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      saveMissions(updated);
      return updated;
    });
  }, []);

  return {
    missions,
    activeMissions: missions.filter((m) => m.status === 'active'),
    completedMissions: missions.filter((m) => m.status === 'completed'),
    addMission,
    completeMission,
    deleteMission,
  };
}
