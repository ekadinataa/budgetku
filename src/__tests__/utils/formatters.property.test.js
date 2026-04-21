import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { fmtFull, fmt } from '../../utils/formatters.js';

// ── Property 11: Currency and abbreviated formatting ─────────────────────────
// Feature: budget-money-tracker, Property 11: Currency and abbreviated formatting
// **Validates: Requirements 8.4, 8.5**

describe('Property 11: Currency and abbreviated formatting', () => {
  it('fmtFull produces string containing "Rp" with no decimal digits', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100_000_000 }), (n) => {
        const result = fmtFull(n);

        // Contains "Rp"
        expect(result).toContain('Rp');

        // No decimal digits: should not have a comma or period followed by
        // fractional digits at the end (e.g., ".50" or ",50")
        // Indonesian format uses period as thousands separator, so we check
        // there's no decimal fraction pattern
        expect(result).not.toMatch(/[,]\d{1,2}$/);
      }),
      { numRuns: 100 }
    );
  });

  it('fmt produces "jt" suffix for values >= 1,000,000', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1_000_000, max: 100_000_000 }), (n) => {
        const result = fmt(n);
        expect(result).toMatch(/jt$/);
      }),
      { numRuns: 100 }
    );
  });

  it('fmt produces "rb" suffix for values >= 1,000 and < 1,000,000', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1_000, max: 999_999 }), (n) => {
        const result = fmt(n);
        expect(result).toMatch(/rb$/);
      }),
      { numRuns: 100 }
    );
  });

  it('abbreviated value is approximately correct for millions', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1_000_000, max: 100_000_000 }), (n) => {
        const result = fmt(n);
        // Extract numeric part before "jt"
        const numStr = result.replace('jt', '');
        const parsed = parseFloat(numStr.replace(',', '.'));
        const actual = n / 1_000_000;

        // Should be within rounding tolerance (fmt uses toFixed(1))
        expect(Math.abs(parsed - actual)).toBeLessThanOrEqual(0.1);
      }),
      { numRuns: 100 }
    );
  });

  it('abbreviated value is approximately correct for thousands', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1_000, max: 999_999 }), (n) => {
        const result = fmt(n);
        // Extract numeric part before "rb"
        const numStr = result.replace('rb', '');
        const parsed = parseFloat(numStr);
        const actual = n / 1_000;

        // Should be within rounding tolerance (fmt uses toFixed(0))
        expect(Math.abs(parsed - actual)).toBeLessThanOrEqual(0.5);
      }),
      { numRuns: 100 }
    );
  });
});
