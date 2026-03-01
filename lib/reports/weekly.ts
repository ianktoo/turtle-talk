/**
 * Builds a parent-facing weekly summary payload from completed missions.
 * Maps mission themes to courage areas: social, performance, repair.
 */

const AREAS = [
  {
    id: 'social-courage',
    label: 'Social Courage',
    description: 'Talking to new people, joining groups, making friends',
    icon: '🤝',
    themes: ['social'] as const,
  },
  {
    id: 'performance-bravery',
    label: 'Performance Bravery',
    description: 'Speaking up in class, presenting, performing',
    icon: '🎤',
    themes: ['brave', 'confident'] as const,
  },
  {
    id: 'repair-courage',
    label: 'Repair Courage',
    description: 'Apologizing, fixing mistakes, reconnecting after conflict',
    icon: '🌱',
    themes: ['kind', 'calm', 'creative', 'curious'] as const,
  },
] as const;

const MAX_SCORE = 5;

export interface MissionForReport {
  id: string;
  title: string;
  theme: string;
  completedAt?: string | null;
}

export interface SummaryArea {
  id: string;
  label: string;
  description: string;
  score: number;
  maxScore: number;
  icon: string;
  highlights: string[];
}

export interface WeeklySummaryPayload {
  childId: string;
  weekOf: string;
  areas: SummaryArea[];
}

/**
 * Builds weekly summary payload from completed missions for the week.
 * Scores are 1 per mission in that area (capped at MAX_SCORE); highlights are mission titles.
 */
export function buildWeeklySummaryFromMissions(
  childId: string,
  weekOf: string,
  missions: MissionForReport[]
): WeeklySummaryPayload {
  const areas = AREAS.map((area) => {
    const matching = missions.filter((m) =>
      area.themes.includes(m.theme as (typeof area.themes)[number])
    );
    const score = Math.min(matching.length, MAX_SCORE);
    const highlights = matching.slice(0, 5).map((m) => m.title);
    return {
      id: area.id,
      label: area.label,
      description: area.description,
      score,
      maxScore: MAX_SCORE,
      icon: area.icon,
      highlights,
    };
  });

  return { childId, weekOf, areas };
}

/** Returns Monday of the week for a given date (YYYY-MM-DD). */
export function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

/** Returns the next Monday after weekStart. */
export function getWeekEnd(weekStart: string): Date {
  const d = new Date(weekStart + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 7);
  return d;
}
