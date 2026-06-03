/**
 * Period Adjuster utility for BudgetX.
 *
 * Provides business day detection and cycle start date adjustment
 * for the salary-aware Custom Siklus mode. When the nominal payday
 * falls on a weekend or Indonesian public holiday, the cycle start
 * shifts backward to the nearest preceding business day.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { isHoliday } from '../data/holidays.js';

/**
 * Check if a date is a business day (Monday–Friday and not an Indonesian public holiday).
 *
 * @param {Date} date - The date to check
 * @returns {boolean} `true` if the date is a business day
 */
export function isBusinessDay(date) {
  const day = date.getDay();
  // Saturday = 6, Sunday = 0
  if (day === 0 || day === 6) return false;
  return !isHoliday(date);
}

/**
 * Adjust a nominal cycle start date to the nearest preceding business day.
 *
 * Constructs the nominal date from (year, month, day), then walks backward
 * up to 7 days until `isBusinessDay` returns `true`. If no business day is
 * found within 7 days, returns the nominal date unchanged.
 *
 * @param {number} year - Full year (e.g. 2025)
 * @param {number} month - 1-indexed month (1 = January, 12 = December)
 * @param {number} day - Nominal cycle start day (2–28)
 * @returns {Date} The adjusted date (or the nominal date as fallback)
 */
export function adjustCycleStart(year, month, day) {
  const nominal = new Date(year, month - 1, day);

  for (let offset = 0; offset <= 7; offset++) {
    const candidate = new Date(year, month - 1, day - offset);
    if (isBusinessDay(candidate)) {
      return candidate;
    }
  }

  // Fallback: no business day found within 7 days
  return nominal;
}
