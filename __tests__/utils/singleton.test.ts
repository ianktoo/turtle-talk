import { createLazySingleton, pickProvider } from '@/lib/utils/singleton';

describe('createLazySingleton', () => {
  it('calls factory exactly once and returns the same instance', () => {
    const factory = jest.fn(() => ({ value: 42 }));
    const getInstance = createLazySingleton(factory);

    const a = getInstance();
    const b = getInstance();

    expect(factory).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it('returns the value produced by the factory', () => {
    const getInstance = createLazySingleton(() => 'hello');
    expect(getInstance()).toBe('hello');
  });
});

describe('pickProvider', () => {
  it('returns the value when it is in the allowed list', () => {
    expect(pickProvider('MY_VAR', 'supabase', ['localStorage', 'supabase', 'convex'], 'localStorage'))
      .toBe('supabase');
  });

  it('returns the fallback when value is undefined', () => {
    expect(pickProvider('MY_VAR', undefined, ['localStorage', 'supabase'], 'localStorage'))
      .toBe('localStorage');
  });

  it('returns the fallback when value is empty string', () => {
    expect(pickProvider('MY_VAR', '', ['localStorage', 'supabase'], 'localStorage'))
      .toBe('localStorage');
  });

  it('returns the fallback when value is whitespace-only', () => {
    expect(pickProvider('MY_VAR', '   ', ['localStorage', 'supabase'], 'localStorage'))
      .toBe('localStorage');
  });

  it('trims trailing newline from value (Vercel env var quirk)', () => {
    expect(pickProvider('MY_VAR', 'supabase\n', ['localStorage', 'supabase'], 'localStorage'))
      .toBe('supabase');
  });

  it('throws a descriptive error for an unknown value', () => {
    expect(() =>
      pickProvider('MY_VAR', 'postgres', ['localStorage', 'supabase', 'convex'], 'localStorage')
    ).toThrow('Unknown provider "postgres" for MY_VAR. Allowed: localStorage, supabase, convex');
  });
});
