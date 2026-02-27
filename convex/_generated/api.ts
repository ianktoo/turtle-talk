/**
 * Stub generated API — replaced by 'npx convex dev' when you connect a real Convex deployment.
 *
 * The string values here are the Convex function paths used at runtime by ConvexHttpClient.
 * They must match the exported function names in convex/missions.ts and convex/memory.ts.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const api = {
  missions: {
    list:     'missions:list'     as any,
    add:      'missions:add'      as any,
    complete: 'missions:complete' as any,
    remove:   'missions:remove'   as any,
  },
  memory: {
    get:      'memory:get'      as any,
    patch:    'memory:patch'    as any,
    addTopic: 'memory:addTopic' as any,
    clear:    'memory:clear'    as any,
  },
} as const;
