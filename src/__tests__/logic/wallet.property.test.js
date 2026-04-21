import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { computeWalletAggregates } from '../../utils/helpers.js';

// ── Arbitraries ──────────────────────────────────────────────────────────────

const walletTypeArb = fc.constantFrom('bank', 'ewallet', 'credit', 'paylater', 'cash');

const walletArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }).map((s) => 'w_' + s),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  type: walletTypeArb,
  balance: fc.integer({ min: -100_000_000, max: 100_000_000 }),
  color: fc.array(fc.constantFrom(...'0123456789abcdef'.split('')), { minLength: 6, maxLength: 6 }).map((a) => '#' + a.join('')),
  note: fc.string({ maxLength: 30 }),
});

const walletsArb = fc.array(walletArb, { minLength: 0, maxLength: 20 });

// ── Property 1: Wallet balance aggregation ───────────────────────────────────
// Feature: budget-money-tracker, Property 1: Wallet balance aggregation
// **Validates: Requirements 3.1**

describe('Property 1: Wallet balance aggregation', () => {
  it('net balance equals sum of all balances', () => {
    fc.assert(
      fc.property(walletsArb, (wallets) => {
        const { netBalance } = computeWalletAggregates(wallets);
        const expectedNet = wallets.reduce((sum, w) => sum + w.balance, 0);
        expect(netBalance).toBe(expectedNet);
      }),
      { numRuns: 100 }
    );
  });

  it('total asset equals sum of positive balances', () => {
    fc.assert(
      fc.property(walletsArb, (wallets) => {
        const { totalAsset } = computeWalletAggregates(wallets);
        const expectedAsset = wallets
          .filter((w) => w.balance >= 0)
          .reduce((sum, w) => sum + w.balance, 0);
        expect(totalAsset).toBe(expectedAsset);
      }),
      { numRuns: 100 }
    );
  });

  it('total debt equals sum of negative balances', () => {
    fc.assert(
      fc.property(walletsArb, (wallets) => {
        const { totalDebt } = computeWalletAggregates(wallets);
        const expectedDebt = wallets
          .filter((w) => w.balance < 0)
          .reduce((sum, w) => sum + w.balance, 0);
        expect(totalDebt).toBe(expectedDebt);
      }),
      { numRuns: 100 }
    );
  });

  it('netBalance = totalAsset + totalDebt', () => {
    fc.assert(
      fc.property(walletsArb, (wallets) => {
        const { netBalance, totalAsset, totalDebt } = computeWalletAggregates(wallets);
        expect(netBalance).toBe(totalAsset + totalDebt);
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 2: Transfer conserves total balance ─────────────────────────────
// Feature: budget-money-tracker, Property 2: Transfer conserves total balance
// **Validates: Requirements 3.8**

describe('Property 2: Transfer conserves total balance', () => {
  it('source decreases by amount, destination increases by amount, total unchanged', () => {
    // Generate two distinct wallets and a positive transfer amount
    const twoDistinctWalletsArb = fc
      .tuple(walletArb, walletArb)
      .filter(([a, b]) => a.id !== b.id);

    const transferAmountArb = fc.integer({ min: 1, max: 50_000_000 });

    fc.assert(
      fc.property(
        twoDistinctWalletsArb,
        transferAmountArb,
        walletsArb,
        ([source, dest], amount, otherWallets) => {
          // Build wallet list: source, dest, plus any others (with unique ids)
          const usedIds = new Set([source.id, dest.id]);
          const others = otherWallets.filter((w) => !usedIds.has(w.id));
          const walletsBefore = [source, dest, ...others];

          const totalBefore = walletsBefore.reduce((s, w) => s + w.balance, 0);

          // Execute transfer: deduct from source, add to destination
          const walletsAfter = walletsBefore.map((w) => {
            if (w.id === source.id) return { ...w, balance: w.balance - amount };
            if (w.id === dest.id) return { ...w, balance: w.balance + amount };
            return w;
          });

          const srcAfter = walletsAfter.find((w) => w.id === source.id);
          const dstAfter = walletsAfter.find((w) => w.id === dest.id);
          const totalAfter = walletsAfter.reduce((s, w) => s + w.balance, 0);

          // Source decreased by amount
          expect(srcAfter.balance).toBe(source.balance - amount);
          // Destination increased by amount
          expect(dstAfter.balance).toBe(dest.balance + amount);
          // Total balance unchanged
          expect(totalAfter).toBe(totalBefore);
        }
      ),
      { numRuns: 100 }
    );
  });
});
