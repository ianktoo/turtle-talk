/**
 * Demo wish pool for guest users (no login).
 * Used on Garden v2 when nobody is logged in.
 */

export interface DemoWishOption {
  id: string;
  label: string;
  theme_slug: string;
}

const DEMO_WISH_POOL: DemoWishOption[] = [
  { id: 'demo-movies-1', label: 'Go to the cinema to see a movie', theme_slug: 'movies' },
  { id: 'demo-movies-2', label: 'A new movie night with popcorn', theme_slug: 'movies' },
  { id: 'demo-movies-3', label: 'Watch a favourite film with family', theme_slug: 'movies' },
  { id: 'demo-toys-1', label: 'A new LEGO set', theme_slug: 'toys' },
  { id: 'demo-toys-2', label: 'A stuffed animal friend', theme_slug: 'toys' },
  { id: 'demo-toys-3', label: 'A new board game', theme_slug: 'toys' },
  { id: 'demo-toys-4', label: 'A cool action figure', theme_slug: 'toys' },
  { id: 'demo-christmas-1', label: 'A special Christmas present', theme_slug: 'christmas-present' },
  { id: 'demo-christmas-2', label: 'A surprise under the tree', theme_slug: 'christmas-present' },
  { id: 'demo-christmas-3', label: 'A new winter coat', theme_slug: 'christmas-present' },
  { id: 'demo-books-1', label: 'A new book series', theme_slug: 'books' },
  { id: 'demo-books-2', label: 'A trip to the library', theme_slug: 'books' },
  { id: 'demo-books-3', label: 'A comic book collection', theme_slug: 'books' },
  { id: 'demo-games-1', label: 'A new video game', theme_slug: 'games' },
  { id: 'demo-games-2', label: 'A family game night', theme_slug: 'games' },
  { id: 'demo-games-3', label: 'A puzzle to solve together', theme_slug: 'games' },
  { id: 'demo-other-1', label: 'A day at the park', theme_slug: 'other' },
  { id: 'demo-other-2', label: 'Ice cream with friends', theme_slug: 'other' },
  { id: 'demo-other-3', label: 'A sleepover with a friend', theme_slug: 'other' },
];

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Pick `count` demo wishes from the pool, ensuring variety across themes.
 */
export function pickDemoWishes(count: number = 5): DemoWishOption[] {
  const shuffled = shuffle(DEMO_WISH_POOL);
  const byTheme = new Map<string, DemoWishOption[]>();
  for (const w of shuffled) {
    const list = byTheme.get(w.theme_slug) ?? [];
    list.push(w);
    byTheme.set(w.theme_slug, list);
  }
  const themes = Array.from(byTheme.keys());
  shuffle(themes);
  const result: DemoWishOption[] = [];
  let themeIdx = 0;
  while (result.length < count && themes.length > 0) {
    const theme = themes[themeIdx % themes.length];
    const list = byTheme.get(theme) ?? [];
    if (list.length > 0) {
      const picked = list.pop()!;
      result.push(picked);
    }
    themeIdx++;
    if (themeIdx > themes.length * 2) break;
  }
  while (result.length < count && shuffled.length > 0) {
    const w = shuffled.find((x) => !result.some((r) => r.id === x.id));
    if (w) result.push(w);
    else break;
  }
  return result.slice(0, count);
}

/**
 * Alias for pickDemoWishes(5) — used for "Generate again".
 */
export function regenerateDemoWishes(): DemoWishOption[] {
  return pickDemoWishes(5);
}
