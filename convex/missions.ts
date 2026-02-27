import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

export const list = query({
  args: { childId: v.string() },
  handler: async (ctx, { childId }) => {
    const rows = await ctx.db
      .query('missions')
      .withIndex('by_child', (q) => q.eq('childId', childId))
      .order('desc')
      .collect();
    return rows.map((r) => ({
      id: r._id,
      title: r.title,
      description: r.description,
      theme: r.theme,
      difficulty: r.difficulty,
      status: r.status,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
    }));
  },
});

export const add = mutation({
  args: {
    childId: v.string(),
    suggestion: v.object({
      title: v.string(),
      description: v.string(),
      theme: v.string(),
      difficulty: v.union(v.literal('easy'), v.literal('medium'), v.literal('stretch')),
    }),
  },
  handler: async (ctx, { childId, suggestion }) => {
    const createdAt = new Date().toISOString();
    const id = await ctx.db.insert('missions', {
      childId,
      title: suggestion.title,
      description: suggestion.description,
      theme: suggestion.theme,
      difficulty: suggestion.difficulty,
      status: 'active',
      createdAt,
    });
    return {
      id: String(id),
      title: suggestion.title,
      description: suggestion.description,
      theme: suggestion.theme,
      difficulty: suggestion.difficulty,
      status: 'active' as const,
      createdAt,
    };
  },
});

export const complete = mutation({
  args: { childId: v.string(), missionId: v.string() },
  handler: async (ctx, { missionId }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await ctx.db.patch(missionId as any, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
  },
});

export const remove = mutation({
  args: { childId: v.string(), missionId: v.string() },
  handler: async (ctx, { missionId }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await ctx.db.delete(missionId as any);
  },
});
