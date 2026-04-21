import { describe, it, expect } from 'vitest';
import { fmtFull, fmt, fmtDate, monthKey } from '../../utils/formatters.js';

describe('fmtFull', () => {
  it('formats a positive number as IDR currency', () => {
    const result = fmtFull(1500000);
    expect(result).toContain('Rp');
    expect(result).toContain('1.500.000');
  });

  it('formats zero', () => {
    const result = fmtFull(0);
    expect(result).toContain('Rp');
    expect(result).toContain('0');
  });

  it('formats a negative number', () => {
    const result = fmtFull(-750000);
    expect(result).toContain('Rp');
    expect(result).toContain('750.000');
  });

  it('has no decimal digits', () => {
    const result = fmtFull(1234567);
    // Should not contain a comma or period followed by decimal digits at the end
    expect(result).not.toMatch(/[.,]\d{1,2}$/);
  });
});

describe('fmt', () => {
  it('formats millions with "jt" suffix', () => {
    expect(fmt(1500000)).toBe('1.5jt');
  });

  it('formats exact millions without trailing .0', () => {
    expect(fmt(2000000)).toBe('2jt');
  });

  it('formats thousands with "rb" suffix', () => {
    expect(fmt(500000)).toBe('500rb');
  });

  it('formats small thousands', () => {
    expect(fmt(1000)).toBe('1rb');
  });

  it('returns plain number for values below 1000', () => {
    expect(fmt(800)).toBe('800');
    expect(fmt(0)).toBe('0');
  });

  it('handles negative millions', () => {
    expect(fmt(-1500000)).toBe('-1.5jt');
  });

  it('handles negative thousands', () => {
    expect(fmt(-5000)).toBe('-5rb');
  });
});

describe('fmtDate', () => {
  it('formats a date string in Indonesian locale', () => {
    const result = fmtDate('2026-04-19');
    expect(result).toContain('19');
    expect(result).toContain('2026');
    // Should contain an abbreviated month in Indonesian
    expect(result).toMatch(/Apr/i);
  });

  it('formats January date', () => {
    const result = fmtDate('2026-01-05');
    expect(result).toContain('5');
    expect(result).toContain('2026');
    expect(result).toMatch(/Jan/i);
  });
});

describe('monthKey', () => {
  it('returns YYYY-MM for a date', () => {
    expect(monthKey(new Date(2026, 3, 19))).toBe('2026-04');
  });

  it('pads single-digit months with leading zero', () => {
    expect(monthKey(new Date(2026, 0, 1))).toBe('2026-01');
  });

  it('handles December', () => {
    expect(monthKey(new Date(2026, 11, 31))).toBe('2026-12');
  });
});
