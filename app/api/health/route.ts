import { NextRequest } from 'next/server';
import { getCachedHealthResult, runHealthChecks, formatSummary } from '@/lib/health';

/**
 * GET /api/health — minimal summary for end users / monitoring.
 * Use ?verbose=1 or header X-Health-Detail: 1 for full checklist (developers).
 */
export async function GET(req: NextRequest): Promise<Response> {
  const verbose =
    req.nextUrl.searchParams.get('verbose') === '1' || req.headers.get('X-Health-Detail') === '1';

  let result = getCachedHealthResult();
  if (!result) {
    result = await runHealthChecks();
  }

  const summary = formatSummary(result);
  const body: { ok: boolean; summary: string; details?: typeof result.items } = {
    ok: result.ok,
    summary,
  };
  if (verbose) {
    body.details = result.items;
  }

  return Response.json(body);
}
