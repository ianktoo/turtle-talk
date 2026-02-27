/**
 * Database service factory.
 *
 * Set NEXT_PUBLIC_DB_PROVIDER to 'supabase' or 'convex'.
 * Defaults to 'localStorage' — no config needed in dev.
 */
import type { DatabaseService } from './types';

export type { DatabaseService };
export type { ChildMemory } from './types';

let _instance: DatabaseService | null = null;

export function getDb(): DatabaseService {
  if (_instance) return _instance;

  const provider = process.env.NEXT_PUBLIC_DB_PROVIDER ?? 'localStorage';

  if (provider === 'supabase') {
    // Dynamic import keeps Supabase client-side only when needed
    const { SupabaseDatabaseService } = require('./providers/supabase');
    _instance = new SupabaseDatabaseService();
  } else if (provider === 'convex') {
    const { ConvexDatabaseService } = require('./providers/convex');
    _instance = new ConvexDatabaseService();
  } else {
    const { LocalStorageDatabaseService } = require('./providers/localStorage');
    _instance = new LocalStorageDatabaseService();
  }

  return _instance!;
}

/**
 * Returns a stable device UUID, creating one on first call.
 * Used as childId when no explicit child profile is selected.
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let id = localStorage.getItem('turtle-talk-device-id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('turtle-talk-device-id', id);
    }
    return id;
  } catch {
    return 'unknown';
  }
}
