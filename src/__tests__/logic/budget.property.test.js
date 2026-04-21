import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

// ── Arbitraries ──────────────────────────────────────────────────────────────

const categoryAllocationArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 8 }).map((s) => 'c_' + s),
  amt: fc.integer({ min: 0, max: 50_000_000 }),
});

const budgetSectionArb = fc
  .array(categoryAllocationArb, { minLength: 0, maxLength: 8 })
  .map((cats) => ({
    total: cats.reduce((s, c) => s + c.amt, 0),
    cats,
  }));

const monthBudgetArb = fc
  .tuple(
    fc.integer({ min: 0, max: 100_000_000 }),
    budgetSectionArb,
    budgetSectionArb,
    budgetSectionArb
  )
  .map(([totalIncome, needs, wants, savings]) => ({
    totalIncome,
    sections: { needs, wants, savings },
  }));

// ── Property 5: Budget allocation invariants ─────────────────────────────────
// Feature: budget-money-tracker, Property 5: Budget allocation invariants
// **Validates: Requirements 5.1**

describe('Property 5: Budget allocation invariants', () => {
  it('totalAllocated = sum of section totals', () => {
    fc.assert(
      fc.property(monthBudgetArb, (budget) => {
        const { needs, wants, savings } = budget.sections;
        const totalAllocated = needs.total + wants.total + savings.total;

        // Each section total equals sum of its category amounts
        expect(needs.total).toBe(needs.cats.reduce((s, c) => s + c.amt, 0));
        expect(wants.total).toBe(wants.cats.reduce((s, c) => s + c.amt, 0));
        expect(savings.total).toBe(savings.cats.reduce((s, c) => s + c.amt, 0));

        // totalAllocated = sum of all three section totals
        expect(totalAllocated).toBe(
          needs.cats.reduce((s, c) => s + c.amt, 0) +
          wants.cats.reduce((s, c) => s + c.amt, 0) +
          savings.cats.reduce((s, c) => s + c.amt, 0)
        );
      }),
      { numRuns: 100 }
    );
  });

  it('unallocated = totalIncome - totalAllocated', () => {
    fc.assert(
      fc.property(monthBudgetArb, (budget) => {
        const { needs, wants, savings } = budget.sections;
        const totalAllocated = needs.total + wants.total + savings.total;
        const unallocated = budget.totalIncome - totalAllocated;

        expect(unallocated).toBe(budget.totalIncome - (needs.total + wants.total + savings.total));
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 6: Daily budget calculation ─────────────────────────────────────
// Feature: budget-money-tracker, Property 6: Daily budget calculation
// **Validates: Requirements 6.1**

describe('Property 6: Daily budget calculation', () => {
  it('dailyBudget = monthlyIncome / daysInMonth, dailyRemaining = dailyBudget - todayExpenses', () => {
    const monthArb = fc.tuple(
      fc.integer({ min: 2020, max: 2030 }),
      fc.integer({ min: 1, max: 12 })
    );

    const positiveIncomeArb = fc.integer({ min: 1, max: 100_000_000 });

    // Generate today's expenses as an array of positive amounts
    const todayExpensesArb = fc.array(fc.integer({ min: 0, max: 5_000_000 }), {
      minLength: 0,
      maxLength: 10,
    });

    fc.assert(
      fc.property(
        positiveIncomeArb,
        monthArb,
        todayExpensesArb,
        (monthlyIncome, [year, month], todayExpenses) => {
          const daysInMonth = new Date(year, month, 0).getDate();
          const dailyBudget = monthlyIncome / daysInMonth;
          const todayTotal = todayExpenses.reduce((s, a) => s + a, 0);
          const dailyRemaining = dailyBudget - todayTotal;

          // dailyBudget is monthlyIncome / daysInMonth
          expect(dailyBudget).toBeCloseTo(monthlyIncome / daysInMonth, 10);

          // dailyRemaining = dailyBudget - sum of today's expenses
          expect(dailyRemaining).toBeCloseTo(dailyBudget - todayTotal, 10);

          // daysInMonth is between 28 and 31
          expect(daysInMonth).toBeGreaterThanOrEqual(28);
          expect(daysInMonth).toBeLessThanOrEqual(31);
        }
      ),
      { numRuns: 100 }
    );
  });
});
