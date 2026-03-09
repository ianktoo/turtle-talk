/**
 * Thematic areas and curated quotes for kids.
 * Shown in the notification area when there are no notifications.
 * One random quote from a random theme is displayed per load.
 */

export const QUOTE_THEMATIC_AREAS = [
  { slug: 'bravery', label: 'Bravery', emoji: '💪' },
  { slug: 'kindness', label: 'Kindness', emoji: '💚' },
  { slug: 'curiosity', label: 'Curiosity', emoji: '🔍' },
  { slug: 'friendship', label: 'Friendship', emoji: '🤝' },
  { slug: 'growth', label: 'Growing', emoji: '🌱' },
] as const;

type Slug = (typeof QUOTE_THEMATIC_AREAS)[number]['slug'];

const QUOTES_BY_THEME: Record<Slug, string[]> = {
  bravery: [
    "You're braver than you know!",
    "Every brave step counts.",
    "Courage is trying even when it feels scary.",
    "You did something hard today. That's brave!",
  ],
  kindness: [
    "Kind words make the world brighter.",
    "A little kindness goes a long way.",
    "You make people smile. Keep it up!",
    "Being kind is being strong.",
  ],
  curiosity: [
    "Questions are how we learn. Keep wondering!",
    "The best adventures start with curiosity.",
    "There's so much to discover. Have fun exploring!",
    "Your ideas matter. Share them!",
  ],
  friendship: [
    "Good friends make every day better.",
    "You're a great friend when you listen and care.",
    "Together we're stronger.",
    "Sharing and caring—that's friendship!",
  ],
  growth: [
    "You're growing every day. Keep going!",
    "Mistakes help us learn. You're doing great!",
    "Every day you get a little bit better.",
    "Small steps add up to big things.",
  ],
};

export type KidQuote = {
  theme: Slug;
  label: string;
  emoji: string;
  text: string;
};

export function getRandomKidQuote(theme?: Slug): KidQuote {
  const area =
    theme != null
      ? QUOTE_THEMATIC_AREAS.find((a) => a.slug === theme) ?? QUOTE_THEMATIC_AREAS[0]
      : QUOTE_THEMATIC_AREAS[Math.floor(Math.random() * QUOTE_THEMATIC_AREAS.length)];
  const quotes = QUOTES_BY_THEME[area.slug];
  const text = quotes[Math.floor(Math.random() * quotes.length)];
  return {
    theme: area.slug,
    label: area.label,
    emoji: area.emoji,
    text,
  };
}
