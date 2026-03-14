import type { DemoStep } from '@/app/demo/demoSession';

export function isDemoModeEnabled(): boolean {
  return process.env.DEMO_MODE_ENABLED?.trim() !== 'false';
}

/**
 * Parse the comma-separated NEXT_PUBLIC_DEMO_SKIP_STEPS env var into a Set
 * of DemoStep values that should be skipped in the demo flow.
 *
 * Example: NEXT_PUBLIC_DEMO_SKIP_STEPS=tattleCard,wish
 */
export function getDemoSkippedSteps(): Set<DemoStep> {
  const raw =
    typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_DEMO_SKIP_STEPS
      : undefined;
  if (!raw) return new Set();
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean) as DemoStep[],
  );
}
