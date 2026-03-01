/**
 * Startup health-check types.
 * Used by instrumentation and optional /api/health for a minimal summary (end users)
 * and detailed checklist (developers).
 */

export type HealthLevel = 'critical' | 'error' | 'info';

export interface HealthItem {
  id: string;
  level: HealthLevel;
  message: string;
  detail?: string;
}

export interface HealthSummary {
  ok: boolean;
  critical: number;
  error: number;
  info: number;
}

export interface HealthResult extends HealthSummary {
  items: HealthItem[];
}
