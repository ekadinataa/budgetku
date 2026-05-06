// ── Indonesian Public Holiday Data ───────────────────────────────────────────
// Static dataset of Indonesian public holidays (2024–2030).
// Fixed holidays repeat every year; variable holidays shift annually.
// Sources: Indonesian Joint Ministerial Decrees, publicholidays.co.id,
// officeholidays.com, timeanddate.com, calendarlabs.com

/**
 * Fixed holidays — same date every year.
 * @type {Array<{ month: number, day: number, name: string }>}
 */
export const FIXED_HOLIDAYS = [
  { month: 1, day: 1, name: 'Tahun Baru Masehi' },
  { month: 5, day: 1, name: 'Hari Buruh Internasional' },
  { month: 6, day: 1, name: 'Hari Lahir Pancasila' },
  { month: 8, day: 17, name: 'Hari Kemerdekaan RI' },
  { month: 12, day: 25, name: 'Hari Natal' },
];

/**
 * Variable holidays — different date each year.
 * Keyed by year, each entry is { month, day, name }.
 * Covers 2024–2030. Islamic holidays shift ~10–11 days earlier each Gregorian year.
 * @type {Record<number, Array<{ month: number, day: number, name: string }>>}
 */
export const VARIABLE_HOLIDAYS = {
  2024: [
    { month: 2, day: 8, name: 'Isra Mi\'raj Nabi Muhammad SAW' },
    { month: 2, day: 10, name: 'Tahun Baru Imlek' },
    { month: 3, day: 11, name: 'Hari Raya Nyepi' },
    { month: 3, day: 29, name: 'Wafat Isa Almasih' },
    { month: 4, day: 10, name: 'Hari Raya Idul Fitri' },
    { month: 4, day: 11, name: 'Hari Raya Idul Fitri' },
    { month: 5, day: 9, name: 'Kenaikan Isa Almasih' },
    { month: 5, day: 23, name: 'Hari Raya Waisak' },
    { month: 6, day: 17, name: 'Hari Raya Idul Adha' },
    { month: 7, day: 7, name: 'Tahun Baru Islam 1 Muharram' },
    { month: 9, day: 16, name: 'Maulid Nabi Muhammad SAW' },
  ],
  2025: [
    { month: 1, day: 27, name: 'Isra Mi\'raj Nabi Muhammad SAW' },
    { month: 1, day: 29, name: 'Tahun Baru Imlek' },
    { month: 3, day: 29, name: 'Hari Raya Nyepi' },
    { month: 3, day: 31, name: 'Hari Raya Idul Fitri' },
    { month: 4, day: 1, name: 'Hari Raya Idul Fitri' },
    { month: 4, day: 18, name: 'Wafat Isa Almasih' },
    { month: 5, day: 12, name: 'Hari Raya Waisak' },
    { month: 5, day: 29, name: 'Kenaikan Isa Almasih' },
    { month: 6, day: 6, name: 'Hari Raya Idul Adha' },
    { month: 6, day: 27, name: 'Tahun Baru Islam 1 Muharram' },
    { month: 9, day: 5, name: 'Maulid Nabi Muhammad SAW' },
  ],
  2026: [
    { month: 1, day: 16, name: 'Isra Mi\'raj Nabi Muhammad SAW' },
    { month: 2, day: 17, name: 'Tahun Baru Imlek' },
    { month: 3, day: 19, name: 'Hari Raya Nyepi' },
    { month: 3, day: 21, name: 'Hari Raya Idul Fitri' },
    { month: 3, day: 22, name: 'Hari Raya Idul Fitri' },
    { month: 4, day: 3, name: 'Wafat Isa Almasih' },
    { month: 5, day: 14, name: 'Kenaikan Isa Almasih' },
    { month: 5, day: 27, name: 'Hari Raya Idul Adha' },
    { month: 5, day: 31, name: 'Hari Raya Waisak' },
    { month: 6, day: 16, name: 'Tahun Baru Islam 1 Muharram' },
    { month: 8, day: 25, name: 'Maulid Nabi Muhammad SAW' },
  ],
  2027: [
    { month: 1, day: 5, name: 'Isra Mi\'raj Nabi Muhammad SAW' },
    { month: 2, day: 6, name: 'Tahun Baru Imlek' },
    { month: 3, day: 9, name: 'Hari Raya Nyepi' },
    { month: 3, day: 10, name: 'Hari Raya Idul Fitri' },
    { month: 3, day: 11, name: 'Hari Raya Idul Fitri' },
    { month: 3, day: 26, name: 'Wafat Isa Almasih' },
    { month: 5, day: 6, name: 'Kenaikan Isa Almasih' },
    { month: 5, day: 17, name: 'Hari Raya Idul Adha' },
    { month: 5, day: 20, name: 'Hari Raya Waisak' },
    { month: 6, day: 6, name: 'Tahun Baru Islam 1 Muharram' },
    { month: 8, day: 15, name: 'Maulid Nabi Muhammad SAW' },
    { month: 12, day: 26, name: 'Isra Mi\'raj Nabi Muhammad SAW' },
  ],
  2028: [
    { month: 1, day: 26, name: 'Tahun Baru Imlek' },
    { month: 2, day: 26, name: 'Hari Raya Idul Fitri' },
    { month: 2, day: 27, name: 'Hari Raya Idul Fitri' },
    { month: 3, day: 26, name: 'Hari Raya Nyepi' },
    { month: 4, day: 14, name: 'Wafat Isa Almasih' },
    { month: 5, day: 5, name: 'Hari Raya Idul Adha' },
    { month: 5, day: 9, name: 'Hari Raya Waisak' },
    { month: 5, day: 25, name: 'Kenaikan Isa Almasih' },
    { month: 5, day: 25, name: 'Tahun Baru Islam 1 Muharram' },
    { month: 8, day: 3, name: 'Maulid Nabi Muhammad SAW' },
    { month: 12, day: 14, name: 'Isra Mi\'raj Nabi Muhammad SAW' },
  ],
  2029: [
    { month: 2, day: 13, name: 'Tahun Baru Imlek' },
    { month: 2, day: 14, name: 'Hari Raya Idul Fitri' },
    { month: 2, day: 15, name: 'Hari Raya Idul Fitri' },
    { month: 3, day: 14, name: 'Hari Raya Nyepi' },
    { month: 3, day: 30, name: 'Wafat Isa Almasih' },
    { month: 4, day: 24, name: 'Hari Raya Idul Adha' },
    { month: 5, day: 10, name: 'Kenaikan Isa Almasih' },
    { month: 5, day: 15, name: 'Tahun Baru Islam 1 Muharram' },
    { month: 5, day: 27, name: 'Hari Raya Waisak' },
    { month: 7, day: 24, name: 'Maulid Nabi Muhammad SAW' },
    { month: 12, day: 4, name: 'Isra Mi\'raj Nabi Muhammad SAW' },
  ],
  2030: [
    { month: 2, day: 3, name: 'Tahun Baru Imlek' },
    { month: 2, day: 4, name: 'Hari Raya Idul Fitri' },
    { month: 2, day: 5, name: 'Hari Raya Idul Fitri' },
    { month: 3, day: 3, name: 'Hari Raya Nyepi' },
    { month: 4, day: 13, name: 'Hari Raya Idul Adha' },
    { month: 4, day: 19, name: 'Wafat Isa Almasih' },
    { month: 5, day: 4, name: 'Tahun Baru Islam 1 Muharram' },
    { month: 5, day: 16, name: 'Hari Raya Waisak' },
    { month: 5, day: 30, name: 'Kenaikan Isa Almasih' },
    { month: 7, day: 14, name: 'Maulid Nabi Muhammad SAW' },
    { month: 11, day: 23, name: 'Isra Mi\'raj Nabi Muhammad SAW' },
  ],
};

/**
 * Get all holidays for a given year.
 * Merges fixed holidays with variable holidays for the specified year.
 * Returns an empty array for years outside the 2024–2030 range.
 *
 * @param {number} year - Year (2024–2030)
 * @returns {Array<{ month: number, day: number, name: string }>}
 */
export function getHolidays(year) {
  const variable = VARIABLE_HOLIDAYS[year];
  if (!variable) return [];
  return [...FIXED_HOLIDAYS, ...variable];
}

/**
 * Check if a specific date is an Indonesian public holiday.
 * Returns false for dates in years outside the supported range (2024–2030).
 *
 * @param {Date} date - The date to check
 * @returns {boolean}
 */
export function isHoliday(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const holidays = getHolidays(year);
  return holidays.some((h) => h.month === month && h.day === day);
}
