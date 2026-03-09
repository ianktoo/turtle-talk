/**
 * Decoration types: emoji + short meaning for garden UI and parent honor.
 * Mission themes map to these; "parent_honored_wish" is used when a parent honors a wish.
 */

export const DECORATION_MEANINGS: Record<string, { emoji: string; meaning: string }> = {
  brave: { emoji: '🦁', meaning: 'Bravery' },
  kind: { emoji: '💛', meaning: 'Kindness' },
  calm: { emoji: '🌊', meaning: 'Calm' },
  confident: { emoji: '⭐', meaning: 'Confidence' },
  creative: { emoji: '🎨', meaning: 'Creativity' },
  social: { emoji: '🤝', meaning: 'Friendship' },
  curious: { emoji: '🔍', meaning: 'Curiosity' },
  /** Used when parent honors one of the child's wishes */
  parent_honored_wish: { emoji: '🎁', meaning: 'Wish granted' },
};

/** Emoji only, for backward compatibility with useLocalTree / tree placement */
export const DECORATION_EMOJI: Record<string, string> = Object.fromEntries(
  Object.entries(DECORATION_MEANINGS).map(([k, v]) => [k, v.emoji])
);

export const DEFAULT_DECORATION_EMOJI = '🔍';

export function getDecorationEmoji(themeOrKey: string): string {
  return DECORATION_MEANINGS[themeOrKey]?.emoji ?? DECORATION_EMOJI[themeOrKey] ?? DEFAULT_DECORATION_EMOJI;
}

export function getDecorationMeaning(themeOrKey: string): string {
  return DECORATION_MEANINGS[themeOrKey]?.meaning ?? themeOrKey;
}

/** Emoji to use when parent honors a wish (added as encouragement to child's garden) */
export const PARENT_HONORED_WISH_EMOJI = DECORATION_MEANINGS.parent_honored_wish.emoji;
