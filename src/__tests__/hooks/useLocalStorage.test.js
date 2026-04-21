import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { STORAGE_KEY } from '../../utils/constants.js';

// Create a proper localStorage mock since jsdom's localStorage is non-standard
const storageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => (key in store ? store[key] : null)),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    _getStore: () => store,
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: storageMock, writable: true });

describe('useLocalStorage', () => {
  beforeEach(() => {
    storageMock.clear();
    vi.clearAllMocks();
  });

  // ── Reading from localStorage on mount ────────────────────────────────────

  it('reads and parses existing value from localStorage on mount', () => {
    const stored = { wallets: [{ id: 'w1', name: 'BCA' }], darkMode: true };
    storageMock.setItem(STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, {}));
    expect(result.current[0]).toEqual(stored);
  });

  // ── Falling back to default when key doesn't exist ────────────────────────

  it('falls back to defaultValue when key does not exist', () => {
    const defaultVal = { page: 'dashboard', wallets: [] };
    const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, defaultVal));
    expect(result.current[0]).toEqual(defaultVal);
  });

  // ── Falling back to default when JSON is corrupted ────────────────────────

  it('falls back to defaultValue when stored JSON is corrupted', () => {
    storageMock.setItem(STORAGE_KEY, '{invalid json!!!');
    const defaultVal = { page: 'dashboard' };

    const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, defaultVal));
    expect(result.current[0]).toEqual(defaultVal);
  });

  // ── Writing to localStorage on state change ───────────────────────────────

  it('writes updated value to localStorage when state changes', () => {
    const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, { count: 0 }));

    act(() => {
      result.current[1]({ count: 42 });
    });

    expect(result.current[0]).toEqual({ count: 42 });
    expect(JSON.parse(storageMock._getStore()[STORAGE_KEY])).toEqual({ count: 42 });
  });

  // ── Round-trip serialization/deserialization ──────────────────────────────

  it('round-trips complex state through localStorage', () => {
    const complexState = {
      page: 'wallet',
      wallets: [
        { id: 'w1', name: 'BCA', type: 'bank', balance: 8500000, color: '#2563EB', note: '7890' },
      ],
      transactions: [
        { id: 't1', date: '2026-04-01', walletId: 'w1', type: 'income', categoryId: 'c15', amount: 12000000, note: 'Gaji', tags: ['rutin'] },
      ],
      budgets: {
        '2026-04': {
          totalIncome: 12000000,
          sections: {
            needs: { total: 6000000, cats: [{ id: 'c1', amt: 1500000 }] },
            wants: { total: 3600000, cats: [] },
            savings: { total: 2400000, cats: [] },
          },
        },
      },
      categories: [
        { id: 'c1', name: 'Makanan', section: 'needs', color: '#F59E0B' },
      ],
      darkMode: true,
      cycleStart: 25,
    };

    // Write the state via the hook
    const { result, unmount } = renderHook(() => useLocalStorage(STORAGE_KEY, {}));

    act(() => {
      result.current[1](complexState);
    });

    unmount();

    // Re-mount and verify the state is restored from localStorage
    const { result: result2 } = renderHook(() => useLocalStorage(STORAGE_KEY, {}));
    expect(result2.current[0]).toEqual(complexState);
  });

  // ── Reads stored primitive values ─────────────────────────────────────────

  it('reads stored primitive values correctly', () => {
    storageMock.setItem('test_num', JSON.stringify(42));
    const { result } = renderHook(() => useLocalStorage('test_num', 0));
    expect(result.current[0]).toBe(42);
  });

  // ── Writes default to localStorage on first mount ─────────────────────────

  it('persists the default value to localStorage on first mount', () => {
    const defaultVal = { initialized: true };
    renderHook(() => useLocalStorage(STORAGE_KEY, defaultVal));

    expect(JSON.parse(storageMock._getStore()[STORAGE_KEY])).toEqual(defaultVal);
  });

  // ── Functional updates work correctly ─────────────────────────────────────

  it('supports functional updates via setValue', () => {
    const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, { count: 0 }));

    act(() => {
      result.current[1]((prev) => ({ ...prev, count: prev.count + 1 }));
    });

    expect(result.current[0]).toEqual({ count: 1 });
    expect(JSON.parse(storageMock._getStore()[STORAGE_KEY])).toEqual({ count: 1 });
  });
});
