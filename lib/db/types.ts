import type { Mission, MissionSuggestion } from '@/lib/speech/types';

export type { Mission, MissionSuggestion };

// Child memory stored per device (no auth required in first phase)
export interface ChildMemory {
  childId: string;
  childName: string | null;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  topics: string[];
}

export interface DatabaseService {
  // Missions
  getMissions(childId: string): Promise<Mission[]>;
  /** Synchronous read for instant React state init. Returns null for async providers. */
  getMissionsSync?(childId: string): Mission[] | null;
  addMission(childId: string, suggestion: MissionSuggestion): Promise<Mission>;
  completeMission(childId: string, missionId: string): Promise<void>;
  deleteMission(childId: string, missionId: string): Promise<void>;

  // Child memory
  getMemory(childId: string): Promise<ChildMemory>;
  /**
   * Optional synchronous read — implemented by local providers for instant
   * React state initialisation. Returns null for async providers (Supabase, Convex),
   * which then fall back to the async getMemory path.
   */
  getMemorySync?(childId: string): ChildMemory | null;
  saveChildName(childId: string, name: string): Promise<void>;
  saveMessages(childId: string, messages: ChildMemory['messages']): Promise<void>;
  addTopic(childId: string, topic: string): Promise<void>;
  clearMemory(childId: string): Promise<void>;
}
