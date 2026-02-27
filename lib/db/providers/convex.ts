/**
 * ConvexDatabaseService
 *
 * Uses ConvexHttpClient for imperative calls (safe outside React component tree).
 *
 * Requires env vars:
 *   NEXT_PUBLIC_CONVEX_URL
 *
 * Functions live in convex/missions.ts and convex/memory.ts.
 */
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';
import type { DatabaseService, ChildMemory, Mission, MissionSuggestion } from '../types';

function getClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error('Missing NEXT_PUBLIC_CONVEX_URL');
  return new ConvexHttpClient(url);
}

export class ConvexDatabaseService implements DatabaseService {
  private client: ConvexHttpClient;

  constructor() {
    this.client = getClient();
  }

  async getMissions(childId: string): Promise<Mission[]> {
    return this.client.query(api.missions.list, { childId });
  }

  async addMission(childId: string, suggestion: MissionSuggestion): Promise<Mission> {
    return this.client.mutation(api.missions.add, { childId, suggestion });
  }

  async completeMission(childId: string, missionId: string): Promise<void> {
    await this.client.mutation(api.missions.complete, { childId, missionId });
  }

  async deleteMission(childId: string, missionId: string): Promise<void> {
    await this.client.mutation(api.missions.remove, { childId, missionId });
  }

  async getMemory(childId: string): Promise<ChildMemory> {
    return this.client.query(api.memory.get, { childId });
  }

  async saveChildName(childId: string, name: string): Promise<void> {
    await this.client.mutation(api.memory.patch, { childId, childName: name.trim() });
  }

  async saveMessages(childId: string, messages: ChildMemory['messages']): Promise<void> {
    await this.client.mutation(api.memory.patch, { childId, messages: messages.slice(-20) });
  }

  async addTopic(childId: string, topic: string): Promise<void> {
    await this.client.mutation(api.memory.addTopic, { childId, topic: topic.trim().toLowerCase() });
  }

  async clearMemory(childId: string): Promise<void> {
    await this.client.mutation(api.memory.clear, { childId });
  }
}
