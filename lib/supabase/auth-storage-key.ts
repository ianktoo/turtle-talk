/**
 * Auth cookie/storage key for Supabase SSR.
 * When set, isolates sessions by origin (e.g. localhost vs production use different keys).
 * Use NEXT_PUBLIC_AUTH_STORAGE_KEY explicitly, or derive from NEXT_PUBLIC_APP_URL.
 */
export function getAuthStorageKey(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_AUTH_STORAGE_KEY?.trim();
  if (explicit) return explicit;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl) return undefined;

  try {
    const hostname = new URL(appUrl).hostname || 'app';
    const slug = hostname.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'app';
    return `sb-${slug}-auth`;
  } catch {
    return undefined;
  }
}
