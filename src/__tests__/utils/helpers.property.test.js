import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getPeriodRange, filterCategoriesByTxType } from '../../utils/helpers.js';

// ── Arbitraries ──────────────────────────────────────────────────────────────

const monthKeyArb = fc
  .tuple(fc.integer({ min: 2020, max: 2030 }), fc.integer({ min: 1, max: 12 }))
  .map(([y, m]) => `${y}-${String(m).padStart(2, '0')}`);

const cycleStartArb = fc.integer({ min: 1, max: 28 });

const sectionArb = fc.constantFrom('needs', 'wants', 'savings', 'income');

const categoryArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }).map((s) => 'c_' + s),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  section: sectionArb,
  color: fc.array(fc.constantFrom(...'0123456789abcdef'.split('')), { minLength: 6, maxLength: 6 }).map((a) => '#' + a.join('')),
});

const categoriesArb = fc.array(categoryArb, { minLength: 0, maxLength: 20 });

// ── Property 9: Billing cycle period range computation ───────────────────────
// Feature: budget-money-tracker, Property 9: Billing cycle period range computation
// **Validates: Requirements 7.7**

describe('Property 9: Billing cycle period range computation', () => {
  it('start < end for any valid month key and cycle start', () => {
    fc.assert(
      fc.property(monthKeyArb, cycleStartArb, (mk, cs) => {
        const range = getPeriodRange(mk, cs);
        expect(range.start < range.end).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('range spans approximately 28-31 days', () => {
    fc.assert(
      fc.property(monthKeyArb, cycleStartArb, (mk, cs) => {
        const range = getPeriodRange(mk, cs);
        const startDate = new Date(range.start + 'T00:00:00');
        const endDate = new Date(range.end + 'T00:00:00');
        const diffMs = endDate.getTime() - startDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        // Range should span approximately one month (27-31 days)
        expect(diffDays).toBeGreaterThanOrEqual(27);
        expect(diffDays).toBeLessThanOrEqual(31);
      }),
      { numRuns: 100 }
    );
  });

  it('cycleStart=1 gives first-to-last day of month', () => {
    fc.assert(
      fc.property(monthKeyArb, (mk) => {
        const range = getPeriodRange(mk, 1);
        const [y, m] = mk.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();

        expect(range.start).toBe(`${mk}-01`);
        expect(range.end).toBe(
          `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
        );
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 12: Category filtering by transaction type ──────────────────────
// Feature: budget-money-tracker, Property 12: Category filtering by transaction type
// **Validates: Requirements 10.3**

describe('Property 12: Category filtering by transaction type', () => {
  it('income-type returns only income-section categories', () => {
    fc.assert(
      fc.property(categoriesArb, (cats) => {
        const result = filterCategoriesByTxType(cats, 'income');
        for (const c of result) {
          expect(c.section).toBe('income');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('expense-type returns only non-income-section categories', () => {
    fc.assert(
      fc.property(categoriesArb, (cats) => {
        const result = filterCategoriesByTxType(cats, 'expense');
        for (const c of result) {
          expect(c.section).not.toBe('income');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('union of income and expense filtered sets covers all categories', () => {
    fc.assert(
      fc.property(categoriesArb, (cats) => {
        const incomeFiltered = filterCategoriesByTxType(cats, 'income');
        const expenseFiltered = filterCategoriesByTxType(cats, 'expense');
        const union = [...incomeFiltered, ...expenseFiltered];

        // Union should have same length as original
        expect(union.length).toBe(cats.length);

        // Every original category should be in the union
        for (const c of cats) {
          expect(union).toContainEqual(c);
        }
      }),
      { numRuns: 100 }
    );
  });
});
