import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

// ── Arbitraries ──────────────────────────────────────────────────────────────

const walletTypeArb = fc.constantFrom('bank', 'ewallet', 'credit', 'paylater', 'cash');
const sectionArb = fc.constantFrom('needs', 'wants', 'savings', 'income');
const txTypeArb = fc.constantFrom('income', 'expense', 'transfer');

const dateStrArb = fc
  .tuple(
    fc.integer({ min: 2020, max: 2030 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 })
  )
  .map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

const hexColorArb = fc.array(fc.constantFrom(...'0123456789abcdef'.split('')), { minLength: 6, maxLength: 6 }).map((a) => '#' + a.join(''));

const walletArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }).map((s) => 'w_' + s),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  type: walletTypeArb,
  balance: fc.integer({ min: -100_000_000, max: 100_000_000 }),
  color: hexColorArb,
  note: fc.string({ maxLength: 30 }),
});

const categoryArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }).map((s) => 'c_' + s),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  section: sectionArb,
  color: hexColorArb,
});

const transactionArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }).map((s) => 'tx_' + s),
  date: dateStrArb,
  walletId: fc.string({ minLength: 1, maxLength: 10 }).map((s) => 'w_' + s),
  type: txTypeArb,
  categoryId: fc.option(
    fc.string({ minLength: 1, maxLength: 10 }).map((s) => 'c_' + s),
    { nil: null }
  ),
  amount: fc.integer({ min: 0, max: 50_000_000 }),
  note: fc.string({ maxLength: 50 }),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 15 }), { minLength: 0, maxLength: 5 }),
});

const categoryAllocationArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }).map((s) => 'c_' + s),
  amt: fc.integer({ min: 0, max: 50_000_000 }),
});

const budgetSectionArb = fc.record({
  total: fc.integer({ min: 0, max: 50_000_000 }),
  cats: fc.array(categoryAllocationArb, { minLength: 0, maxLength: 6 }),
});

const monthBudgetArb = fc.record({
  totalIncome: fc.integer({ min: 0, max: 100_000_000 }),
  sections: fc.record({
    needs: budgetSectionArb,
    wants: budgetSectionArb,
    savings: budgetSectionArb,
  }),
});

const monthKeyArb = fc
  .tuple(fc.integer({ min: 2020, max: 2030 }), fc.integer({ min: 1, max: 12 }))
  .map(([y, m]) => `${y}-${String(m).padStart(2, '0')}`);

const budgetsArb = fc
  .array(fc.tuple(monthKeyArb, monthBudgetArb), { minLength: 0, maxLength: 3 })
  .map((entries) => Object.fromEntries(entries));

const pageArb = fc.constantFrom('dashboard', 'wallet', 'tx', 'budget', 'report');

const appStateArb = fc.record({
  page: pageArb,
  wallets: fc.array(walletArb, { minLength: 0, maxLength: 10 }),
  transactions: fc.array(transactionArb, { minLength: 0, maxLength: 20 }),
  budgets: budgetsArb,
  categories: fc.array(categoryArb, { minLength: 0, maxLength: 15 }),
  darkMode: fc.boolean(),
  cycleStart: fc.integer({ min: 1, max: 28 }),
});

// ── Property 10: State serialization round trip ──────────────────────────────
// Feature: budget-money-tracker, Property 10: State serialization round trip
// **Validates: Requirements 8.2**

describe('Property 10: State serialization round trip', () => {
  it('JSON.stringify then JSON.parse produces equal state', () => {
    fc.assert(
      fc.property(appStateArb, (state) => {
        const serialized = JSON.stringify(state);
        const deserialized = JSON.parse(serialized);
        expect(deserialized).toEqual(state);
      }),
      { numRuns: 100 }
    );
  });
});
