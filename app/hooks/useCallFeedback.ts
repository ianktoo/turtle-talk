'use client';

import { useCallback } from 'react';
import { getDb } from '@/lib/db';
import type { CallFeedbackRecord } from '@/lib/db/types';

export function useCallFeedback() {
  const saveCallFeedback = useCallback(async (record: CallFeedbackRecord) => {
    await getDb().saveCallFeedback?.(record);
  }, []);

  return { saveCallFeedback };
}
