/**
 * Tattle Cards — data layer.
 *
 * Currently returns a hardcoded set of kid-friendly tattle cards.
 * Future: swap `getTattleCards()` to fetch from Supabase / admin API
 * once the `tattle_cards` table + admin CRUD page exist.
 */

export interface TattleCard {
  id: string;
  title: string;
  description: string;
  emoji: string;
  /** Optional grouping for admin filtering (e.g. "emotions", "social", "self"). */
  category?: string;
  /** When false the card is hidden from the picker. Default true. */
  isActive?: boolean;
}

export const DEFAULT_TATTLE_CARDS: readonly TattleCard[] = [
  {
    id: 'sea-shell',
    title: 'Sea Shell Secret',
    description: 'Tell Shelly a tiny secret that feels safe to share.',
    emoji: '\u{1F41A}',
    category: 'self',
  },
  {
    id: 'storm-cloud',
    title: 'Storm Cloud',
    description: 'Share something that felt unfair or yucky today.',
    emoji: '\u{1F327}\uFE0F',
    category: 'emotions',
  },
  {
    id: 'sparkle-wave',
    title: 'Sparkle Wave',
    description: 'Tell Shelly about something you were proud of.',
    emoji: '\u2728',
    category: 'emotions',
  },
  {
    id: 'tiny-brave',
    title: 'Tiny Brave Step',
    description: 'Talk about a time you tried something new.',
    emoji: '\u{1F9B6}',
    category: 'self',
  },
  {
    id: 'friendship-bubble',
    title: 'Friendship Bubble',
    description: 'Share a moment with a friend that felt big.',
    emoji: '\u{1FAE7}',
    category: 'social',
  },
  {
    id: 'quiet-corner',
    title: 'Quiet Corner',
    description: 'Tell Shelly about a time you needed some space.',
    emoji: '\u{1F6CB}\uFE0F',
    category: 'self',
  },
];

/**
 * Returns the active tattle cards for the demo picker.
 * Future: fetch from Supabase when admin management is wired up.
 */
export function getTattleCards(): readonly TattleCard[] {
  return DEFAULT_TATTLE_CARDS.filter((c) => c.isActive !== false);
}
