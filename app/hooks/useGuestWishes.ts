'use client';

import { useState, useCallback, useEffect } from 'react';
import { pickDemoWishes, regenerateDemoWishes } from '@/lib/wishes/demo-wishes';
import {
  getGuestWishOptions,
  saveGuestWishOptions,
  getGuestWishSelected,
  saveGuestWishSelected,
  getGuestWishCompleted,
  saveGuestWishCompleted,
  type GuestWishOption,
} from '@/lib/db/providers/localStorage';

export function useGuestWishes() {
  const [options, setOptions] = useState<GuestWishOption[]>(() =>
    typeof window !== 'undefined' ? getGuestWishOptions() : []
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    const ids = getGuestWishSelected();
    return new Set(ids);
  });
  const [completed, setCompleted] = useState<boolean>(() =>
    typeof window !== 'undefined' ? getGuestWishCompleted() : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = getGuestWishOptions();
    if (stored.length === 0) {
      const picked = pickDemoWishes(5);
      saveGuestWishOptions(picked);
      setOptions(picked);
    }
  }, []);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      const arr = Array.from(next);
      saveGuestWishSelected(arr);
      return next;
    });
  }, []);

  const submit = useCallback(() => {
    if (selectedIds.size !== 3) return;
    saveGuestWishCompleted(true);
    setCompleted(true);
  }, [selectedIds.size]);

  const regenerate = useCallback(() => {
    const picked = regenerateDemoWishes();
    saveGuestWishOptions(picked);
    saveGuestWishSelected([]);
    saveGuestWishCompleted(false);
    setOptions(picked);
    setSelectedIds(new Set());
    setCompleted(false);
  }, []);

  return {
    options,
    selectedIds,
    completed,
    toggle,
    submit,
    regenerate,
  };
}
