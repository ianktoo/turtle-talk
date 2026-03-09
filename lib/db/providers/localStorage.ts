/**
 * LocalStorageDatabaseService
 *
 * Default provider — identical behaviour to the original hooks.
 * Keys are scoped by childId to support multiple children on one device.
 */
import type { DatabaseService, ChildMemory, Journal, Mission, MissionSuggestion } from '../types';

const MAX_MESSAGES = 20;
const MAX_TOPICS = 15;

// "default" childId maps to the original key names for backward compatibility
// with data already stored in localStorage before multi-child support.
const LEGACY_KEYS: Record<string, string> = {
  missions: 'turtle-talk-missions',
  name: 'turtle-talk-child-name',
  messages: 'turtle-talk-messages',
  topics: 'turtle-talk-topics',
  journals: 'turtle-talk-journals',
};

function key(childId: string, suffix: string) {
  if (childId === 'default') return LEGACY_KEYS[suffix] ?? `turtle-talk-${suffix}`;
  return `turtle-talk-${childId}-${suffix}`;
}

function readJSON<T>(k: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(k: string, value: unknown): void {
  try {
    localStorage.setItem(k, JSON.stringify(value));
  } catch {
    // Storage unavailable — silently ignore
  }
}

export class LocalStorageDatabaseService implements DatabaseService {
  getMissionsSync(childId: string): Mission[] | null {
    if (typeof window === 'undefined') return null;
    return readJSON<Mission[]>(key(childId, 'missions'), []);
  }

  async getMissions(childId: string): Promise<Mission[]> {
    return this.getMissionsSync(childId) ?? [];
  }

  async addMission(childId: string, suggestion: MissionSuggestion): Promise<Mission> {
    const mission: Mission = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: suggestion.title,
      description: suggestion.description,
      theme: suggestion.theme ?? 'curious',
      difficulty: suggestion.difficulty,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    const current = await this.getMissions(childId);
    writeJSON(key(childId, 'missions'), [mission, ...current]);
    return mission;
  }

  async completeMission(childId: string, missionId: string): Promise<void> {
    const missions = await this.getMissions(childId);
    const updated = missions.map((m) =>
      m.id === missionId
        ? { ...m, status: 'completed' as const, completedAt: new Date().toISOString() }
        : m,
    );
    writeJSON(key(childId, 'missions'), updated);
  }

  async deleteMission(childId: string, missionId: string): Promise<void> {
    const missions = await this.getMissions(childId);
    writeJSON(
      key(childId, 'missions'),
      missions.filter((m) => m.id !== missionId),
    );
  }

  getMemorySync(childId: string): ChildMemory | null {
    if (typeof window === 'undefined') return null;
    return {
      childId,
      childName: localStorage.getItem(key(childId, 'name')),
      messages: readJSON<ChildMemory['messages']>(key(childId, 'messages'), []),
      topics: readJSON<string[]>(key(childId, 'topics'), []),
    };
  }

  async getMemory(childId: string): Promise<ChildMemory> {
    return this.getMemorySync(childId) ?? {
      childId,
      childName: null,
      messages: [],
      topics: [],
    };
  }

  async saveChildName(childId: string, name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      localStorage.setItem(key(childId, 'name'), trimmed);
    } catch { /* ignore */ }
  }

  async saveMessages(childId: string, messages: ChildMemory['messages']): Promise<void> {
    writeJSON(key(childId, 'messages'), messages.slice(-MAX_MESSAGES));
  }

  async addTopic(childId: string, topic: string): Promise<void> {
    const normalised = topic.trim().toLowerCase();
    if (!normalised) return;
    const topics = readJSON<string[]>(key(childId, 'topics'), []);
    const deduped = [normalised, ...topics.filter((t) => t !== normalised)].slice(0, MAX_TOPICS);
    writeJSON(key(childId, 'topics'), deduped);
  }

  async clearMemory(childId: string): Promise<void> {
    ['name', 'messages', 'topics'].forEach((suffix) => {
      try {
        localStorage.removeItem(key(childId, suffix));
      } catch { /* ignore */ }
    });
  }

  async getJournals(childId: string): Promise<Journal[]> {
    return readJSON<Journal[]>(key(childId, 'journals'), []);
  }

  async addJournal(childId: string, audioBase64: string): Promise<Journal> {
    const journal: Journal = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      childId,
      createdAt: new Date().toISOString(),
      audioBase64,
    };
    const current = await this.getJournals(childId);
    writeJSON(key(childId, 'journals'), [journal, ...current]);
    return journal;
  }

  async deleteJournal(childId: string, journalId: string): Promise<void> {
    const journals = await this.getJournals(childId);
    writeJSON(
      key(childId, 'journals'),
      journals.filter((j) => j.id !== journalId),
    );
  }
}

// ---------------------------------------------------------------------------
// Tree decoration helpers (localStorage-only, not on DatabaseService interface)
// ---------------------------------------------------------------------------

/** Client-only: must only be called from 'use client' contexts. */
export function getPlacedMissionIds(childId: string): string[] {
  return readJSON<string[]>(key(childId, 'placedmissions'), []);
}

/** Client-only: must only be called from 'use client' contexts. */
export function savePlacedMissionIds(childId: string, ids: string[]): void {
  writeJSON(key(childId, 'placedmissions'), ids);
}

// ---------------------------------------------------------------------------
// Guest wish demo (no login)
// ---------------------------------------------------------------------------

export interface GuestWishOption {
  id: string;
  label: string;
  theme_slug: string;
}

const GUEST_WISH_OPTIONS_KEY = 'turtle-talk-guest-wish-options';
const GUEST_WISH_SELECTED_KEY = 'turtle-talk-guest-wish-selected';
const GUEST_WISH_COMPLETED_KEY = 'turtle-talk-guest-wish-completed';

export function getGuestWishOptions(): GuestWishOption[] {
  return readJSON<GuestWishOption[]>(GUEST_WISH_OPTIONS_KEY, []);
}

export function saveGuestWishOptions(options: GuestWishOption[]): void {
  writeJSON(GUEST_WISH_OPTIONS_KEY, options);
}

export function getGuestWishSelected(): string[] {
  return readJSON<string[]>(GUEST_WISH_SELECTED_KEY, []);
}

export function saveGuestWishSelected(ids: string[]): void {
  writeJSON(GUEST_WISH_SELECTED_KEY, ids);
}

export function getGuestWishCompleted(): boolean {
  return readJSON<boolean>(GUEST_WISH_COMPLETED_KEY, false);
}

export function saveGuestWishCompleted(completed: boolean): void {
  writeJSON(GUEST_WISH_COMPLETED_KEY, completed);
}

export function resetGuestWishes(): void {
  try {
    localStorage.removeItem(GUEST_WISH_OPTIONS_KEY);
    localStorage.removeItem(GUEST_WISH_SELECTED_KEY);
    localStorage.removeItem(GUEST_WISH_COMPLETED_KEY);
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Guest demo: show growth moment (star on tree) for simulation
// ---------------------------------------------------------------------------

const GUEST_DEMO_STAR_KEY = 'turtle-talk-guest-demo-star';

export function getGuestDemoStar(): boolean {
  return readJSON<boolean>(GUEST_DEMO_STAR_KEY, false);
}

export function setGuestDemoStar(value: boolean): void {
  writeJSON(GUEST_DEMO_STAR_KEY, value);
}

// ---------------------------------------------------------------------------
// Guest demo: add demo decorations (completed missions) for decorate flow
// ---------------------------------------------------------------------------

const DEMO_MISSION_PREFIX = 'guest-demo-';

/** Adds 3 completed demo missions for the default/guest child. Call from client only. Skips if demos already exist. */
export function addDemoMissionsForGuest(): boolean {
  if (typeof window === 'undefined') return false;
  const missionsKey = key('default', 'missions');
  const existing = readJSON<Mission[]>(missionsKey, []);
  const hasDemos = existing.some((m) => m.id.startsWith(DEMO_MISSION_PREFIX));
  if (hasDemos) return false;
  const now = new Date().toISOString();
  const demos: Mission[] = [
    {
      id: `${DEMO_MISSION_PREFIX}brave-${Date.now()}`,
      title: 'Demo: Be brave',
      description: 'Try the decorate flow!',
      theme: 'brave',
      difficulty: 'easy',
      status: 'completed',
      createdAt: now,
      completedAt: now,
    },
    {
      id: `${DEMO_MISSION_PREFIX}kind-${Date.now()}-1`,
      title: 'Demo: Be kind',
      description: 'Place decorations on your tree.',
      theme: 'kind',
      difficulty: 'easy',
      status: 'completed',
      createdAt: now,
      completedAt: now,
    },
    {
      id: `${DEMO_MISSION_PREFIX}creative-${Date.now()}`,
      title: 'Demo: Be creative',
      description: 'Decorate and grow!',
      theme: 'creative',
      difficulty: 'easy',
      status: 'completed',
      createdAt: now,
      completedAt: now,
    },
  ];
  writeJSON(missionsKey, [...demos, ...existing]);
  return true;
}
