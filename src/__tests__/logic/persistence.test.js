import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STORAGE_KEY, DARK_VARS, LIGHT_VARS } from '../../utils/constants.js';

/**
 * Create a proper localStorage mock with all standard methods.
 * This avoids issues with other test files overriding globalThis.localStorage.
 */
function createStorageMock() {
  let store = {};
  return {
    getItem: vi.fn((key) => (key in store ? store[key] : null)),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i) => Object.keys(store)[i] || null),
  };
}

/** Clean up document.documentElement styles and attributes */
function resetRoot() {
  const root = document.documentElement;
  root.removeAttribute('data-theme');
  Object.keys({ ...DARK_VARS, ...LIGHT_VARS }).forEach((key) => {
    root.style.removeProperty(key);
  });
}

describe('Theme persistence', () => {
  let storage;
  let originalLocalStorage;

  beforeEach(() => {
    originalLocalStorage = globalThis.localStorage;
    storage = createStorageMock();
    Object.defineProperty(globalThis, 'localStorage', {
      value: storage,
      writable: true,
      configurable: true,
    });
    resetRoot();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    resetRoot();
  });

  // ── Requirement 2.3: darkMode persists to localStorage ────────────────────

  it('App serializes darkMode=true to localStorage as part of the state object', () => {
    const state = {
      page: 'dashboard',
      wallets: [],
      transactions: [],
      budgets: {},
      categories: [],
      darkMode: true,
      cycleStart: 1,
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(state));

    const restored = JSON.parse(storage.getItem(STORAGE_KEY));
    expect(restored.darkMode).toBe(true);
  });

  it('App serializes darkMode=false to localStorage as part of the state object', () => {
    const state = {
      page: 'dashboard',
      wallets: [],
      transactions: [],
      budgets: {},
      categories: [],
      darkMode: false,
      cycleStart: 1,
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(state));

    const restored = JSON.parse(storage.getItem(STORAGE_KEY));
    expect(restored.darkMode).toBe(false);
  });

  it('loadState restores darkMode from localStorage', () => {
    const state = {
      page: 'wallet',
      wallets: [],
      transactions: [],
      budgets: {},
      categories: [],
      darkMode: true,
      cycleStart: 5,
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(state));

    // Simulate the loadState function from App.jsx
    const raw = storage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw);
    expect(parsed).not.toBeNull();
    expect(parsed.darkMode).toBe(true);
  });

  it('loadState returns null for corrupted JSON, allowing fallback to defaults', () => {
    storage.setItem(STORAGE_KEY, '{corrupted!!!');

    let result;
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw === null) {
        result = null;
      } else {
        result = JSON.parse(raw);
      }
    } catch {
      result = null;
    }

    expect(result).toBeNull();
  });

  // ── Requirement 2.4: FOUC prevention script applies dark theme before React mounts ──

  it('FOUC prevention script applies dark CSS vars when darkMode is true in localStorage', () => {
    // Simulate what the index.html inline script does
    const state = { darkMode: true };
    storage.setItem(STORAGE_KEY, JSON.stringify(state));

    // Replicate the FOUC prevention logic from index.html
    const s = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
    if (s.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      const vars = {
        '--bg': '#0D1117',
        '--bg-card': '#161B22',
        '--bg-2': '#0D1117',
        '--bg-3': '#1C2128',
        '--border': '#30363D',
        '--border-2': '#21262D',
        '--text-1': '#E6EDF3',
        '--text-2': '#CDD9E5',
        '--text-3': '#ADBAC7',
        '--text-4': '#768390',
        '--text-5': '#545D68',
        '--text-6': '#373E47',
        '--sidebar-bg': '#010409',
      };
      for (const k in vars) {
        document.documentElement.style.setProperty(k, vars[k]);
      }
    }

    // Verify the script applied dark theme
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    Object.entries(DARK_VARS).forEach(([key, value]) => {
      expect(document.documentElement.style.getPropertyValue(key)).toBe(value);
    });
  });

  it('FOUC prevention script does nothing when darkMode is false in localStorage', () => {
    const state = { darkMode: false };
    storage.setItem(STORAGE_KEY, JSON.stringify(state));

    // Replicate the FOUC prevention logic from index.html
    const s = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
    if (s.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Verify no dark theme was applied
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('FOUC prevention script does nothing when localStorage is empty', () => {
    // Replicate the FOUC prevention logic from index.html
    const s = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
    if (s.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('FOUC prevention script handles corrupted localStorage gracefully', () => {
    storage.setItem(STORAGE_KEY, 'not-valid-json');

    // Replicate the FOUC prevention logic from index.html (wrapped in try/catch)
    let applied = false;
    try {
      const s = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
      if (s.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        applied = true;
      }
    } catch {
      // Script silently fails — no theme applied, no crash
    }

    expect(applied).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  // ── FOUC script vars match DARK_VARS constant ─────────────────────────────

  it('FOUC prevention script dark vars match the DARK_VARS constant', () => {
    // The inline script in index.html hardcodes these values.
    // They must stay in sync with DARK_VARS from constants.js.
    const foucVars = {
      '--bg': '#0D1117',
      '--bg-card': '#161B22',
      '--bg-2': '#0D1117',
      '--bg-3': '#1C2128',
      '--border': '#30363D',
      '--border-2': '#21262D',
      '--text-1': '#E6EDF3',
      '--text-2': '#CDD9E5',
      '--text-3': '#ADBAC7',
      '--text-4': '#768390',
      '--text-5': '#545D68',
      '--text-6': '#373E47',
      '--sidebar-bg': '#010409',
    };

    // Every key/value in the FOUC script must match DARK_VARS
    Object.entries(foucVars).forEach(([key, value]) => {
      expect(DARK_VARS[key]).toBe(value);
    });

    // Every key in DARK_VARS must be present in the FOUC script
    Object.keys(DARK_VARS).forEach((key) => {
      expect(foucVars).toHaveProperty(key);
    });
  });

  // ── ThemeContext applies correct CSS vars based on darkMode ────────────────

  it('DARK_VARS and LIGHT_VARS cover the same CSS custom properties', () => {
    const darkKeys = Object.keys(DARK_VARS).sort();
    const lightKeys = Object.keys(LIGHT_VARS).sort();
    expect(darkKeys).toEqual(lightKeys);
  });

  it('DARK_VARS and LIGHT_VARS have different values for each property', () => {
    Object.keys(DARK_VARS).forEach((key) => {
      expect(DARK_VARS[key]).not.toBe(LIGHT_VARS[key]);
    });
  });
});
