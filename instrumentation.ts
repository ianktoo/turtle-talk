/**
 * Next.js instrumentation: runs once when the server starts.
 * Kicks off the startup health-check workflow (non-blocking) and logs a minimal
 * summary. In development or when HEALTHCHECK_VERBOSE=true, logs the full checklist.
 */

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { runHealthChecks, formatSummary } = await import('./lib/health');

  void runHealthChecks().then((result) => {
    const summary = formatSummary(result);
    console.log(`[health] ${summary}`);

    const verbose =
      process.env.NODE_ENV === 'development' || process.env.HEALTHCHECK_VERBOSE === 'true';
    if (verbose && result.items.length > 0) {
      for (const item of result.items) {
        const label = item.level.toUpperCase();
        const detail = item.detail ? ` — ${item.detail}` : '';
        console.log(`[health] ${label}: ${item.message}${detail}`);
      }
    }
  });
}
