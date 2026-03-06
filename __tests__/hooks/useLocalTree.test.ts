import { renderHook, act } from '@testing-library/react';
import { useLocalTree } from '@/app/hooks/useLocalTree';

// Pin getDeviceId to 'default' so legacy key names are used
jest.mock('@/lib/db', () => ({
  ...jest.requireActual('@/lib/db'),
  getDeviceId: () => 'default',
}));

// Mock useMissions so we control completedMissions
jest.mock('@/app/hooks/useMissions', () => ({
  useMissions: jest.fn(),
}));

import { useMissions } from '@/app/hooks/useMissions';

const KEY_PLACED = 'turtle-talk-placedmissions';

function mockStorage(data: Record<string, string> = {}) {
  const store: Record<string, string> = { ...data };
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation((k) => store[k] ?? null);
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation((k, v) => { store[k] = v; });
  return store;
}

const makeMission = (id: string, theme: string, status: 'active' | 'completed' = 'completed') => ({
  id,
  title: `Mission ${id}`,
  description: 'desc',
  theme,
  difficulty: 'easy' as const,
  status,
  createdAt: new Date().toISOString(),
});

afterEach(() => jest.restoreAllMocks());

describe('useLocalTree — initial state', () => {
  it('returns empty placed/unplaced when storage empty and no completed missions', () => {
    mockStorage();
    (useMissions as jest.Mock).mockReturnValue({ completedMissions: [] });
    const { result } = renderHook(() => useLocalTree());
    expect(result.current.placedDecorations).toEqual([]);
    expect(result.current.unplacedDecorations).toEqual([]);
    expect(result.current.placedCount).toBe(0);
  });

  it('derives unplaced decorations from completed missions not yet on tree', () => {
    mockStorage();
    (useMissions as jest.Mock).mockReturnValue({
      completedMissions: [makeMission('m1', 'calm'), makeMission('m2', 'brave')],
    });
    const { result } = renderHook(() => useLocalTree());
    expect(result.current.unplacedDecorations).toHaveLength(2);
    expect(result.current.unplacedDecorations[0]).toEqual({ id: 'm1', emoji: '🌊' });
    expect(result.current.unplacedDecorations[1]).toEqual({ id: 'm2', emoji: '🦁' });
  });

  it('loads already-placed missions from localStorage and excludes them from unplaced', () => {
    mockStorage({ [KEY_PLACED]: JSON.stringify(['m1']) });
    (useMissions as jest.Mock).mockReturnValue({
      completedMissions: [makeMission('m1', 'calm'), makeMission('m2', 'brave')],
    });
    const { result } = renderHook(() => useLocalTree());
    expect(result.current.placedDecorations).toHaveLength(1);
    expect(result.current.placedDecorations[0]).toEqual({ emoji: '🌊', slotId: 'slot-0' });
    expect(result.current.unplacedDecorations).toHaveLength(1);
    expect(result.current.unplacedDecorations[0].id).toBe('m2');
  });
});

describe('useLocalTree — placeDecoration', () => {
  it('moves a decoration from unplaced to placed and persists to localStorage', () => {
    const store = mockStorage();
    (useMissions as jest.Mock).mockReturnValue({
      completedMissions: [makeMission('m1', 'curious')],
    });
    const { result } = renderHook(() => useLocalTree());
    act(() => result.current.placeDecoration('m1'));
    expect(result.current.placedDecorations).toHaveLength(1);
    expect(result.current.unplacedDecorations).toHaveLength(0);
    expect(JSON.parse(store[KEY_PLACED])).toEqual(['m1']);
  });

  it('ignores duplicate placeDecoration calls', () => {
    const store = mockStorage({ [KEY_PLACED]: JSON.stringify(['m1']) });
    (useMissions as jest.Mock).mockReturnValue({
      completedMissions: [makeMission('m1', 'kind')],
    });
    const { result } = renderHook(() => useLocalTree());
    act(() => result.current.placeDecoration('m1'));
    expect(result.current.placedCount).toBe(1);
    expect(JSON.parse(store[KEY_PLACED])).toHaveLength(1);
  });
});

describe('useLocalTree — growthStage', () => {
  it('is 0 when nothing is placed', () => {
    mockStorage();
    (useMissions as jest.Mock).mockReturnValue({ completedMissions: [] });
    const { result } = renderHook(() => useLocalTree());
    expect(result.current.growthStage).toBe(0);
  });

  it('increases every 2 placed decorations up to max 5', () => {
    const ids = Array.from({ length: 10 }, (_, i) => `m${i}`);
    mockStorage({ [KEY_PLACED]: JSON.stringify(ids) });
    (useMissions as jest.Mock).mockReturnValue({
      completedMissions: ids.map((id) => makeMission(id, 'curious')),
    });
    const { result } = renderHook(() => useLocalTree());
    expect(result.current.growthStage).toBe(5);
  });
});
