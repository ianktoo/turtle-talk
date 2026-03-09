import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

const ratingValidator = v.union(
  v.literal('happy'),
  v.literal('neutral'),
  v.literal('sad'),
  v.null(),
);

export const save = mutation({
  args: {
    childId: v.string(),
    rating: ratingValidator,
    dismissedAt: v.string(),
    callEndedAt: v.string(),
    source: v.string(),
    timeToDismissMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const createdAt = new Date().toISOString();
    await ctx.db.insert('call_feedback', {
      childId: args.childId,
      rating: args.rating,
      dismissedAt: args.dismissedAt,
      callEndedAt: args.callEndedAt,
      source: args.source,
      timeToDismissMs: args.timeToDismissMs,
      createdAt,
    });
  },
});

/** Admin: aggregated satisfaction counts and recent feedback. */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('call_feedback').collect();
    const byDismissed = [...all].sort((a, b) => b.dismissedAt.localeCompare(a.dismissedAt));
    const total = all.length;
    const happy = all.filter((r) => r.rating === 'happy').length;
    const neutral = all.filter((r) => r.rating === 'neutral').length;
    const sad = all.filter((r) => r.rating === 'sad').length;
    const noRating = all.filter((r) => r.rating === null).length;
    const recent = byDismissed.slice(0, 100).map((r) => ({
      id: r._id,
      childId: r.childId,
      rating: r.rating,
      dismissedAt: r.dismissedAt,
      source: r.source,
    }));
    return { total, happy, neutral, sad, noRating, recent };
  },
});
