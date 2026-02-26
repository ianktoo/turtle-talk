'use client';

import { useState, useEffect, useCallback } from 'react';

export type MicPermissionStatus = 'checking' | 'prompt' | 'granted' | 'denied';

interface UseMicPermissionResult {
  status: MicPermissionStatus;
  requestPermission: () => Promise<void>;
}

export function useMicPermission(): UseMicPermissionResult {
  const [status, setStatus] = useState<MicPermissionStatus>('checking');

  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    // Try permissions API first (more reliable than just calling getUserMedia)
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((result) => {
          setStatus(result.state as MicPermissionStatus);
          result.addEventListener('change', () => {
            setStatus(result.state as MicPermissionStatus);
          });
        })
        .catch(() => {
          // Permissions API not supported — fall back to 'prompt'
          setStatus('prompt');
        });
    } else {
      setStatus('prompt');
    }
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop all tracks immediately — we just needed the permission grant
      stream.getTracks().forEach((t) => t.stop());
      setStatus('granted');
    } catch {
      setStatus('denied');
    }
  }, []);

  return { status, requestPermission };
}
