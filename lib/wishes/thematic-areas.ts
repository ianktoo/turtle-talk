/**
 * Thematic areas for AI-generated wishes.
 * Single source of truth for wish generation and UI.
 * Add or remove slugs/labels here to change themes easily.
 */

export const WISH_THEMATIC_AREAS = [
  { slug: 'movies', label: 'Movies' },
  { slug: 'toys', label: 'Toys' },
  { slug: 'christmas-present', label: 'Christmas present' },
  { slug: 'books', label: 'Books' },
  { slug: 'games', label: 'Games' },
  { slug: 'other', label: 'Other' },
] as const;

export type WishThemeSlug = (typeof WISH_THEMATIC_AREAS)[number]['slug'];

export const WISH_THEME_SLUGS: WishThemeSlug[] = WISH_THEMATIC_AREAS.map((a) => a.slug);

export function getThemeLabel(slug: string): string {
  const found = WISH_THEMATIC_AREAS.find((a) => a.slug === slug);
  return found?.label ?? slug;
}
