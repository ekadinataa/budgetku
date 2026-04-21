import { useState, useEffect } from 'react';

/**
 * Custom hook for reading/writing state to localStorage.
 *
 * - Initializes state by reading from localStorage (with JSON.parse),
 *   falling back to `defaultValue` if the key doesn't exist or JSON is corrupted.
 * - Automatically serializes to localStorage whenever the value changes.
 *
 * @param {string} key - The localStorage key to read/write.
 * @param {*} defaultValue - Fallback value when key is missing or JSON is invalid.
 * @returns {[*, Function]} A [value, setValue] tuple, like useState.
 */
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
