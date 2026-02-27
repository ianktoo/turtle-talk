import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

const messageSchema = v.object({
  role: v.union(v.literal('user'), v.literal('assistant')),
  content: v.string(),
});

export const get = query({
  args: { childId: v.string() },
  handler: async (ctx, { childId }) => {
    const row = await ctx.db
      .query('child_memory')
      .withIndex('by_child', (q) => q.eq('childId', childId))
      .unique();
    if (!row) return { childId, childName: null, messages: [], topics: [] };
    return {
      childId,
      childName: row.childName ?? null,
      messages: row.messages,
      topics: row.topics,
    };
  },
});

export const patch = mutation({
  args: {
    childId: v.string(),
    childName: v.optional(v.string()),
    messages: v.optional(v.array(messageSchema)),
  },
  handler: async (ctx, { childId, childName, messages }) => {
    const existing = await ctx.db
      .query('child_memory')
      .withIndex('by_child', (q) => q.eq('childId', childId))
      .unique();

    const update: Record<string, unknown> = {};
    if (childName !== undefined) update.childName = childName;
    if (messages !== undefined) update.messages = messages;

    if (existing) {
      await ctx.db.patch(existing._id, update);
    } else {
      await ctx.db.insert('child_memory', {
        childId,
        childName: childName ?? undefined,
        messages: messages ?? [],
        topics: [],
      });
    }
  },
});

export const addTopic = mutation({
  args: { childId: v.string(), topic: v.string() },
  handler: async (ctx, { childId, topic }) => {
    const existing = await ctx.db
      .query('child_memory')
      .withIndex('by_child', (q) => q.eq('childId', childId))
      .unique();

    if (existing) {
      const deduped = [topic, ...existing.topics.filter((t) => t !== topic)].slice(0, 15);
      await ctx.db.patch(existing._id, { topics: deduped });
    } else {
      await ctx.db.insert('child_memory', {
        childId,
        messages: [],
        topics: [topic],
      });
    }
  },
});

export const clear = mutation({
  args: { childId: v.string() },
  handler: async (ctx, { childId }) => {
    const existing = await ctx.db
      .query('child_memory')
      .withIndex('by_child', (q) => q.eq('childId', childId))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});
