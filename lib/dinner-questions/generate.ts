/**
 * Generates dinner questions for a child. Uses theme-based templates.
 * Caller is responsible for ensuring parent is allowed and for inserting into DB.
 */

export const THEMES = [
  'social-courage',
  'performance-bravery',
  'repair-courage',
] as const;

const TEMPLATES: Record<(typeof THEMES)[number], string[]> = {
  'social-courage': [
    "What's one thing you tried today that felt a little scary at first?",
    "Did you meet anyone new this week? What was that like?",
    "What's a brave thing you saw a friend do this week?",
    "What's your favourite thing to talk about with your friends?",
    "Did you try something new today, even a tiny bit?",
    "Is there someone you'd like to play with more at school?",
    "Tell me about a moment this week when you helped someone.",
  ],
  'performance-bravery': [
    "Can you tell me about a time you spoke up, even when it felt hard?",
    "Was there anything you wanted to say but felt nervous about?",
    "What's something you're proud of from this week?",
    "What does it feel like in your body when you get nervous?",
  ],
  'repair-courage': [
    "What would you do if you accidentally hurt someone's feelings?",
    "Did anything go wrong this week that you were able to fix?",
    "How do you feel when you apologise to someone?",
    "What makes you feel safe when you're a bit scared?",
  ],
};

const DEFAULT_COUNT = 5;

export interface GenerateOptions {
  /** Number of questions to generate (default 5) */
  count?: number;
  /** Optional: prefer themes from recent missions to tailor questions */
  preferredThemes?: string[];
}

/**
 * Returns an array of { question, theme } for the given options.
 * Spreads across themes when possible; uses preferredThemes to weight selection.
 */
export function generateDinnerQuestions(options: GenerateOptions = {}): {
  question: string;
  theme: string;
}[] {
  const count = Math.min(options.count ?? DEFAULT_COUNT, 15);
  const preferred = options.preferredThemes?.length
    ? options.preferredThemes.filter((t) =>
        THEMES.includes(t as (typeof THEMES)[number])
      )
    : [...THEMES];

  const themeOrder: (typeof THEMES)[number][] = [];
  for (let i = 0; i < count; i++) {
    themeOrder.push(preferred[i % preferred.length] as (typeof THEMES)[number]);
  }
  // Shuffle theme order slightly so not always same pattern
  for (let i = themeOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [themeOrder[i], themeOrder[j]] = [themeOrder[j], themeOrder[i]];
  }

  const used = new Set<string>(); // "theme:questionText" to avoid duplicates
  const out: { question: string; theme: string }[] = [];

  for (const theme of themeOrder) {
    if (out.length >= count) break;
    const list = TEMPLATES[theme];
    const available = list.filter((q) => !used.has(`${theme}:${q}`));
    if (available.length === 0) continue;
    const q = available[Math.floor(Math.random() * available.length)];
    used.add(`${theme}:${q}`);
    out.push({ question: q, theme });
  }

  return out;
}
