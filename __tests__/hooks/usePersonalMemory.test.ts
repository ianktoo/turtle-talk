import { renderHook, act } from '@testing-library/react';
import { usePersonalMemory } from '@/app/hooks/usePersonalMemory';

const KEY_NAME = 'turtle-talk-child-name';
const KEY_MSGS = 'turtle-talk-messages';
const KEY_TOPICS = 'turtle-talk-topics';

function mockStorage(data: Record<string, string> = {}) {
  const store: Record<string, string> = { ...data };
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation((k) => store[k] ?? null);
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation((k, v) => { store[k] = v; });
  jest.spyOn(Storage.prototype, 'removeItem').mockImplementation((k) => { delete store[k]; });
  return store;
}

afterEach(() => jest.restoreAllMocks());

describe('usePersonalMemory — initial load', () => {
  it('returns nulls and empty arrays when storage is empty', () => {
    mockStorage();
    const { result } = renderHook(() => usePersonalMemory());
    expect(result.current.childName).toBeNull();
    expect(result.current.messages).toEqual([]);
    expect(result.current.topics).toEqual([]);
  });

  it('loads persisted values from localStorage', () => {
    const msgs = [{ role: 'user' as const, content: 'hi' }];
    mockStorage({
      [KEY_NAME]: 'Lily',
      [KEY_MSGS]: JSON.stringify(msgs),
      [KEY_TOPICS]: JSON.stringify(['animals', 'space']),
    });
    const { result } = renderHook(() => usePersonalMemory());
    expect(result.current.childName).toBe('Lily');
    expect(result.current.messages).toEqual(msgs);
    expect(result.current.topics).toEqual(['animals', 'space']);
  });

  it('falls back gracefully on corrupt JSON without crashing', () => {
    mockStorage({ [KEY_MSGS]: 'not-json', [KEY_TOPICS]: '{bad}' });
    const { result } = renderHook(() => usePersonalMemory());
    expect(result.current.messages).toEqual([]);
    expect(result.current.topics).toEqual([]);
  });
});

describe('usePersonalMemory — saveChildName', () => {
  it('persists the name and updates state', () => {
    const store = mockStorage();
    const { result } = renderHook(() => usePersonalMemory());
    act(() => result.current.saveChildName('Max'));
    expect(result.current.childName).toBe('Max');
    expect(store[KEY_NAME]).toBe('Max');
  });

  it('ignores empty and whitespace-only strings', () => {
    const store = mockStorage();
    const { result } = renderHook(() => usePersonalMemory());
    act(() => result.current.saveChildName('   '));
    expect(result.current.childName).toBeNull();
    expect(store[KEY_NAME]).toBeUndefined();
  });
});

describe('usePersonalMemory — saveMessages', () => {
  it('persists messages and updates state', () => {
    const store = mockStorage();
    const { result } = renderHook(() => usePersonalMemory());
    const msgs = [{ role: 'user' as const, content: 'hello' }];
    act(() => result.current.saveMessages(msgs));
    expect(result.current.messages).toEqual(msgs);
    expect(JSON.parse(store[KEY_MSGS])).toEqual(msgs);
  });

  it('trims to the last 20 messages', () => {
    const store = mockStorage();
    const { result } = renderHook(() => usePersonalMemory());
    const msgs = Array.from({ length: 25 }, (_, i) => ({ role: 'user' as const, content: `msg ${i}` }));
    act(() => result.current.saveMessages(msgs));
    expect(result.current.messages).toHaveLength(20);
    expect(JSON.parse(store[KEY_MSGS])).toHaveLength(20);
  });
});

describe('usePersonalMemory — saveTopic', () => {
  it('prepends the new topic and deduplicates case-insensitively', () => {
    const store = mockStorage({ [KEY_TOPICS]: JSON.stringify(['animals']) });
    const { result } = renderHook(() => usePersonalMemory());
    act(() => result.current.saveTopic('Animals'));
    expect(result.current.topics[0]).toBe('animals');
    expect(result.current.topics.filter((t) => t === 'animals')).toHaveLength(1);
    expect(JSON.parse(store[KEY_TOPICS])[0]).toBe('animals');
  });

  it('caps topics at 15 entries', () => {
    const existing = Array.from({ length: 15 }, (_, i) => `topic${i}`);
    const store = mockStorage({ [KEY_TOPICS]: JSON.stringify(existing) });
    const { result } = renderHook(() => usePersonalMemory());
    act(() => result.current.saveTopic('new topic'));
    expect(result.current.topics).toHaveLength(15);
    expect(result.current.topics[0]).toBe('new topic');
  });

  it('ignores empty strings', () => {
    const store = mockStorage();
    const { result } = renderHook(() => usePersonalMemory());
    act(() => result.current.saveTopic('  '));
    expect(result.current.topics).toEqual([]);
    expect(store[KEY_TOPICS]).toBeUndefined();
  });
});

describe('usePersonalMemory — clearAll', () => {
  it('removes all keys from storage and resets state', () => {
    const store = mockStorage({
      [KEY_NAME]: 'Lily',
      [KEY_MSGS]: '[]',
      [KEY_TOPICS]: '["animals"]',
    });
    const { result } = renderHook(() => usePersonalMemory());
    act(() => result.current.clearAll());
    expect(result.current.childName).toBeNull();
    expect(result.current.messages).toEqual([]);
    expect(result.current.topics).toEqual([]);
    expect(store[KEY_NAME]).toBeUndefined();
    expect(store[KEY_MSGS]).toBeUndefined();
    expect(store[KEY_TOPICS]).toBeUndefined();
  });
});
