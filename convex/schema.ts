import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  missions: defineTable({
    childId: v.string(),
    title: v.string(),
    description: v.string(),
    theme: v.string(),
    difficulty: v.union(v.literal('easy'), v.literal('medium'), v.literal('stretch')),
    status: v.union(v.literal('active'), v.literal('completed')),
    createdAt: v.string(),
    completedAt: v.optional(v.string()),
  }).index('by_child', ['childId']),

  child_memory: defineTable({
    childId: v.string(),
    childName: v.optional(v.string()),
    messages: v.array(
      v.object({ role: v.union(v.literal('user'), v.literal('assistant')), content: v.string() }),
    ),
    topics: v.array(v.string()),
  }).index('by_child', ['childId']),
});
