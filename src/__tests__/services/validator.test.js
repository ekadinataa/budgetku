import { describe, it, expect } from 'vitest';
import {
  trimStrings,
  findOversizedString,
  validateWallet,
  validateTransaction,
  validateBudget,
  validateCategory,
  validatePreference,
} from '../../services/validator.js';

// ── trimStrings ───────────────────────────────────────────────────────────────
// Validates: Requirement 7.1

describe('trimStrings', () => {
  it('returns null when given null', () => {
    expect(trimStrings(null)).toBeNull();
  });

  it('returns undefined when given undefined', () => {
    expect(trimStrings(undefined)).toBeUndefined();
  });

  it('returns a number when given a number', () => {
    expect(trimStrings(42)).toBe(42);
  });

  it('returns a string when given a string (non-object)', () => {
    expect(trimStrings('hello')).toBe('hello');
  });

  it('trims leading and trailing whitespace from string values', () => {
    const result = trimStrings({ name: '  hello  ', note: '\ttab\n' });
    expect(result.name).toBe('hello');
    expect(result.note).toBe('tab');
  });

  it('does not mutate the original object', () => {
    const original = { name: '  hello  ' };
    const result = trimStrings(original);
    expect(original.name).toBe('  hello  ');
    expect(result.name).toBe('hello');
  });

  it('preserves non-string values unchanged', () => {
    const result = trimStrings({ count: 5, active: true, data: null });
    expect(result.count).toBe(5);
    expect(result.active).toBe(true);
    expect(result.data).toBeNull();
  });

  it('trims strings inside arrays', () => {
    const result = trimStrings({ tags: ['  foo  ', ' bar ', 'baz'] });
    expect(result.tags).toEqual(['foo', 'bar', 'baz']);
  });

  it('preserves non-string items in arrays', () => {
    const result = trimStrings({ items: [' a ', 42, true, null, ' b '] });
    expect(result.items).toEqual(['a', 42, true, null, 'b']);
  });

  it('handles empty object', () => {
    expect(trimStrings({})).toEqual({});
  });

  it('handles object with empty string values', () => {
    const result = trimStrings({ name: '', note: '   ' });
    expect(result.name).toBe('');
    expect(result.note).toBe('');
  });

  it('handles object with empty array', () => {
    const result = trimStrings({ tags: [] });
    expect(result.tags).toEqual([]);
  });
});

// ── findOversizedString ───────────────────────────────────────────────────────
// Validates: Requirement 7.2

describe('findOversizedString', () => {
  it('returns null for null input', () => {
    expect(findOversizedString(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(findOversizedString(undefined)).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(findOversizedString(42)).toBeNull();
  });

  it('returns null when all strings are at exactly 1000 characters', () => {
    const str1000 = 'a'.repeat(1000);
    expect(findOversizedString({ name: str1000 })).toBeNull();
  });

  it('returns the field name when a string is exactly 1001 characters', () => {
    const str1001 = 'a'.repeat(1001);
    expect(findOversizedString({ name: str1001 })).toBe('name');
  });

  it('returns the field name for the first oversized string found', () => {
    const str1001 = 'a'.repeat(1001);
    const result = findOversizedString({ name: 'ok', note: str1001 });
    expect(result).toBe('note');
  });

  it('returns null when object has no string values', () => {
    expect(findOversizedString({ count: 5, active: true })).toBeNull();
  });

  it('returns null for empty object', () => {
    expect(findOversizedString({})).toBeNull();
  });

  it('detects oversized strings inside arrays', () => {
    const str1001 = 'a'.repeat(1001);
    expect(findOversizedString({ tags: ['ok', str1001] })).toBe('tags');
  });

  it('returns null when array strings are all within limit', () => {
    const str1000 = 'a'.repeat(1000);
    expect(findOversizedString({ tags: [str1000, 'short'] })).toBeNull();
  });
});

// ── validateWallet ────────────────────────────────────────────────────────────
// Validates: Requirement 7.3

describe('validateWallet', () => {
  const validWallet = {
    name: 'BCA',
    type: 'bank',
    balance: 1000000,
    color: '#FF0000',
  };

  it('returns null for valid wallet data', () => {
    expect(validateWallet(validWallet)).toBeNull();
  });

  it('returns null for valid wallet with optional note', () => {
    expect(validateWallet({ ...validWallet, note: 'My savings' })).toBeNull();
  });

  it('rejects empty name', () => {
    const result = validateWallet({ ...validWallet, name: '' });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('rejects whitespace-only name (trimmed to empty)', () => {
    const result = validateWallet({ ...validWallet, name: '   ' });
    expect(typeof result).toBe('string');
  });

  it('rejects missing name', () => {
    const { name, ...noName } = validWallet;
    const result = validateWallet(noName);
    expect(typeof result).toBe('string');
  });

  it('rejects invalid wallet type', () => {
    const result = validateWallet({ ...validWallet, type: 'crypto' });
    expect(typeof result).toBe('string');
  });

  it('accepts all valid wallet types', () => {
    for (const type of ['bank', 'ewallet', 'credit', 'paylater', 'cash']) {
      expect(validateWallet({ ...validWallet, type })).toBeNull();
    }
  });

  it('rejects NaN balance', () => {
    const result = validateWallet({ ...validWallet, balance: NaN });
    expect(typeof result).toBe('string');
  });

  it('rejects string balance', () => {
    const result = validateWallet({ ...validWallet, balance: '1000' });
    expect(typeof result).toBe('string');
  });

  it('accepts zero balance', () => {
    expect(validateWallet({ ...validWallet, balance: 0 })).toBeNull();
  });

  it('accepts negative balance', () => {
    expect(validateWallet({ ...validWallet, balance: -500 })).toBeNull();
  });

  it('rejects invalid hex color (missing #)', () => {
    const result = validateWallet({ ...validWallet, color: 'FF0000' });
    expect(typeof result).toBe('string');
  });

  it('rejects invalid hex color (too short)', () => {
    const result = validateWallet({ ...validWallet, color: '#FFF' });
    expect(typeof result).toBe('string');
  });

  it('rejects invalid hex color (invalid chars)', () => {
    const result = validateWallet({ ...validWallet, color: '#GGGGGG' });
    expect(typeof result).toBe('string');
  });

  it('rejects missing color', () => {
    const { color, ...noColor } = validWallet;
    const result = validateWallet(noColor);
    expect(typeof result).toBe('string');
  });

  it('rejects non-string note', () => {
    const result = validateWallet({ ...validWallet, note: 123 });
    expect(typeof result).toBe('string');
  });

  it('rejects oversized name', () => {
    const result = validateWallet({ ...validWallet, name: 'a'.repeat(1001) });
    expect(typeof result).toBe('string');
    expect(result).toContain('exceeds');
  });
});

// ── validateTransaction ───────────────────────────────────────────────────────
// Validates: Requirement 7.4

describe('validateTransaction', () => {
  const validTransaction = {
    date: '2025-04-19',
    walletId: 'w1',
    type: 'expense',
    categoryId: 'c1',
    amount: 50000,
    note: 'Lunch',
    tags: ['food'],
  };

  it('returns null for valid transaction data', () => {
    expect(validateTransaction(validTransaction)).toBeNull();
  });

  it('returns null when categoryId is null', () => {
    expect(validateTransaction({ ...validTransaction, categoryId: null })).toBeNull();
  });

  it('rejects invalid date format (DD-MM-YYYY)', () => {
    const result = validateTransaction({ ...validTransaction, date: '19-04-2025' });
    expect(typeof result).toBe('string');
  });

  it('rejects invalid date format (no dashes)', () => {
    const result = validateTransaction({ ...validTransaction, date: '20250419' });
    expect(typeof result).toBe('string');
  });

  it('rejects missing date', () => {
    const { date, ...noDate } = validTransaction;
    const result = validateTransaction(noDate);
    expect(typeof result).toBe('string');
  });

  it('rejects empty walletId', () => {
    const result = validateTransaction({ ...validTransaction, walletId: '' });
    expect(typeof result).toBe('string');
  });

  it('rejects whitespace-only walletId', () => {
    const result = validateTransaction({ ...validTransaction, walletId: '   ' });
    expect(typeof result).toBe('string');
  });

  it('rejects invalid transaction type', () => {
    const result = validateTransaction({ ...validTransaction, type: 'refund' });
    expect(typeof result).toBe('string');
  });

  it('accepts all valid transaction types', () => {
    for (const type of ['income', 'expense', 'transfer']) {
      const data = { ...validTransaction, type };
      if (type === 'transfer') data.toWalletId = 'w2';
      expect(validateTransaction(data)).toBeNull();
    }
  });

  it('rejects negative amount', () => {
    const result = validateTransaction({ ...validTransaction, amount: -100 });
    expect(typeof result).toBe('string');
  });

  it('rejects zero amount', () => {
    const result = validateTransaction({ ...validTransaction, amount: 0 });
    expect(typeof result).toBe('string');
  });

  it('rejects NaN amount', () => {
    const result = validateTransaction({ ...validTransaction, amount: NaN });
    expect(typeof result).toBe('string');
  });

  it('rejects non-number amount', () => {
    const result = validateTransaction({ ...validTransaction, amount: '50000' });
    expect(typeof result).toBe('string');
  });

  it('rejects non-string note', () => {
    const result = validateTransaction({ ...validTransaction, note: 123 });
    expect(typeof result).toBe('string');
  });

  it('rejects non-array tags', () => {
    const result = validateTransaction({ ...validTransaction, tags: 'food' });
    expect(typeof result).toBe('string');
  });

  it('rejects tags with non-string items', () => {
    const result = validateTransaction({ ...validTransaction, tags: ['food', 42] });
    expect(typeof result).toBe('string');
  });

  it('accepts empty tags array', () => {
    expect(validateTransaction({ ...validTransaction, tags: [] })).toBeNull();
  });

  it('rejects transfer without toWalletId', () => {
    const result = validateTransaction({ ...validTransaction, type: 'transfer' });
    expect(typeof result).toBe('string');
    expect(result).toContain('toWalletId');
  });

  it('rejects transfer with empty toWalletId', () => {
    const result = validateTransaction({
      ...validTransaction,
      type: 'transfer',
      toWalletId: '',
    });
    expect(typeof result).toBe('string');
  });

  it('rejects transfer with whitespace-only toWalletId', () => {
    const result = validateTransaction({
      ...validTransaction,
      type: 'transfer',
      toWalletId: '   ',
    });
    expect(typeof result).toBe('string');
  });

  it('accepts transfer with valid toWalletId', () => {
    const result = validateTransaction({
      ...validTransaction,
      type: 'transfer',
      toWalletId: 'w2',
    });
    expect(result).toBeNull();
  });

  it('rejects non-string categoryId', () => {
    const result = validateTransaction({ ...validTransaction, categoryId: 123 });
    expect(typeof result).toBe('string');
  });
});

// ── validateBudget ────────────────────────────────────────────────────────────
// Validates: Requirement 7.5

describe('validateBudget', () => {
  const validBudget = {
    totalIncome: 5000000,
    sections: {
      needs: { total: 2500000, cats: [{ id: 'c1', amt: 1000000 }] },
      wants: { total: 1500000, cats: [{ id: 'c2', amt: 500000 }] },
      savings: { total: 1000000, cats: [] },
    },
  };

  it('returns null for valid budget data', () => {
    expect(validateBudget(validBudget)).toBeNull();
  });

  it('accepts zero totalIncome', () => {
    expect(validateBudget({ ...validBudget, totalIncome: 0 })).toBeNull();
  });

  it('rejects negative totalIncome', () => {
    const result = validateBudget({ ...validBudget, totalIncome: -1 });
    expect(typeof result).toBe('string');
  });

  it('rejects NaN totalIncome', () => {
    const result = validateBudget({ ...validBudget, totalIncome: NaN });
    expect(typeof result).toBe('string');
  });

  it('rejects string totalIncome', () => {
    const result = validateBudget({ ...validBudget, totalIncome: '5000000' });
    expect(typeof result).toBe('string');
  });

  it('rejects missing sections', () => {
    const result = validateBudget({ totalIncome: 5000000 });
    expect(typeof result).toBe('string');
  });

  it('rejects null sections', () => {
    const result = validateBudget({ totalIncome: 5000000, sections: null });
    expect(typeof result).toBe('string');
  });

  it('rejects missing needs section', () => {
    const { needs, ...rest } = validBudget.sections;
    const result = validateBudget({ totalIncome: 5000000, sections: rest });
    expect(typeof result).toBe('string');
    expect(result).toContain('needs');
  });

  it('rejects missing wants section', () => {
    const { wants, ...rest } = validBudget.sections;
    const result = validateBudget({ totalIncome: 5000000, sections: rest });
    expect(typeof result).toBe('string');
    expect(result).toContain('wants');
  });

  it('rejects missing savings section', () => {
    const { savings, ...rest } = validBudget.sections;
    const result = validateBudget({ totalIncome: 5000000, sections: rest });
    expect(typeof result).toBe('string');
    expect(result).toContain('savings');
  });

  it('rejects negative section total', () => {
    const budget = {
      totalIncome: 5000000,
      sections: {
        ...validBudget.sections,
        needs: { total: -1, cats: [] },
      },
    };
    const result = validateBudget(budget);
    expect(typeof result).toBe('string');
  });

  it('rejects non-array cats', () => {
    const budget = {
      totalIncome: 5000000,
      sections: {
        ...validBudget.sections,
        needs: { total: 100, cats: 'not-array' },
      },
    };
    const result = validateBudget(budget);
    expect(typeof result).toBe('string');
  });

  it('rejects cat with empty id', () => {
    const budget = {
      totalIncome: 5000000,
      sections: {
        ...validBudget.sections,
        needs: { total: 100, cats: [{ id: '', amt: 50 }] },
      },
    };
    const result = validateBudget(budget);
    expect(typeof result).toBe('string');
  });

  it('rejects cat with negative amt', () => {
    const budget = {
      totalIncome: 5000000,
      sections: {
        ...validBudget.sections,
        needs: { total: 100, cats: [{ id: 'c1', amt: -10 }] },
      },
    };
    const result = validateBudget(budget);
    expect(typeof result).toBe('string');
  });

  it('rejects cat with non-number amt', () => {
    const budget = {
      totalIncome: 5000000,
      sections: {
        ...validBudget.sections,
        needs: { total: 100, cats: [{ id: 'c1', amt: '50' }] },
      },
    };
    const result = validateBudget(budget);
    expect(typeof result).toBe('string');
  });

  it('accepts empty cats array in all sections', () => {
    const budget = {
      totalIncome: 0,
      sections: {
        needs: { total: 0, cats: [] },
        wants: { total: 0, cats: [] },
        savings: { total: 0, cats: [] },
      },
    };
    expect(validateBudget(budget)).toBeNull();
  });
});

// ── validateCategory ──────────────────────────────────────────────────────────
// Validates: Requirement 7.6

describe('validateCategory', () => {
  const validCategory = {
    name: 'Food',
    section: 'needs',
    color: '#FF5733',
  };

  it('returns null for valid category data', () => {
    expect(validateCategory(validCategory)).toBeNull();
  });

  it('rejects empty name', () => {
    const result = validateCategory({ ...validCategory, name: '' });
    expect(typeof result).toBe('string');
  });

  it('rejects whitespace-only name', () => {
    const result = validateCategory({ ...validCategory, name: '   ' });
    expect(typeof result).toBe('string');
  });

  it('rejects missing name', () => {
    const { name, ...noName } = validCategory;
    const result = validateCategory(noName);
    expect(typeof result).toBe('string');
  });

  it('rejects invalid section', () => {
    const result = validateCategory({ ...validCategory, section: 'other' });
    expect(typeof result).toBe('string');
  });

  it('accepts all valid sections', () => {
    for (const section of ['needs', 'wants', 'savings', 'income']) {
      expect(validateCategory({ ...validCategory, section })).toBeNull();
    }
  });

  it('rejects invalid hex color', () => {
    const result = validateCategory({ ...validCategory, color: 'red' });
    expect(typeof result).toBe('string');
  });

  it('rejects missing color', () => {
    const { color, ...noColor } = validCategory;
    const result = validateCategory(noColor);
    expect(typeof result).toBe('string');
  });

  it('rejects oversized name', () => {
    const result = validateCategory({ ...validCategory, name: 'a'.repeat(1001) });
    expect(typeof result).toBe('string');
    expect(result).toContain('exceeds');
  });
});

// ── validatePreference ────────────────────────────────────────────────────────
// Validates: Requirement 7.7

describe('validatePreference', () => {
  const validPreference = {
    darkMode: false,
    cycleStart: 1,
    page: 'dashboard',
  };

  it('returns null for valid preference data', () => {
    expect(validatePreference(validPreference)).toBeNull();
  });

  it('rejects non-boolean darkMode (string)', () => {
    const result = validatePreference({ ...validPreference, darkMode: 'true' });
    expect(typeof result).toBe('string');
  });

  it('rejects non-boolean darkMode (number)', () => {
    const result = validatePreference({ ...validPreference, darkMode: 1 });
    expect(typeof result).toBe('string');
  });

  it('accepts darkMode true', () => {
    expect(validatePreference({ ...validPreference, darkMode: true })).toBeNull();
  });

  it('accepts cycleStart at lower boundary (1)', () => {
    expect(validatePreference({ ...validPreference, cycleStart: 1 })).toBeNull();
  });

  it('accepts cycleStart at upper boundary (28)', () => {
    expect(validatePreference({ ...validPreference, cycleStart: 28 })).toBeNull();
  });

  it('rejects cycleStart below lower boundary (0)', () => {
    const result = validatePreference({ ...validPreference, cycleStart: 0 });
    expect(typeof result).toBe('string');
  });

  it('rejects cycleStart above upper boundary (29)', () => {
    const result = validatePreference({ ...validPreference, cycleStart: 29 });
    expect(typeof result).toBe('string');
  });

  it('rejects non-integer cycleStart (float)', () => {
    const result = validatePreference({ ...validPreference, cycleStart: 1.5 });
    expect(typeof result).toBe('string');
  });

  it('rejects non-number cycleStart (string)', () => {
    const result = validatePreference({ ...validPreference, cycleStart: '1' });
    expect(typeof result).toBe('string');
  });

  it('rejects non-string page', () => {
    const result = validatePreference({ ...validPreference, page: 123 });
    expect(typeof result).toBe('string');
  });

  it('rejects null page', () => {
    const result = validatePreference({ ...validPreference, page: null });
    expect(typeof result).toBe('string');
  });

  it('accepts empty string page', () => {
    expect(validatePreference({ ...validPreference, page: '' })).toBeNull();
  });

  it('accepts salaryAdjust as true', () => {
    expect(validatePreference({ ...validPreference, salaryAdjust: true })).toBeNull();
  });

  it('accepts salaryAdjust as false', () => {
    expect(validatePreference({ ...validPreference, salaryAdjust: false })).toBeNull();
  });

  it('accepts missing salaryAdjust (backward compatible)', () => {
    expect(validatePreference(validPreference)).toBeNull();
  });

  it('rejects non-boolean salaryAdjust (string)', () => {
    const result = validatePreference({ ...validPreference, salaryAdjust: 'true' });
    expect(typeof result).toBe('string');
  });

  it('rejects non-boolean salaryAdjust (number)', () => {
    const result = validatePreference({ ...validPreference, salaryAdjust: 1 });
    expect(typeof result).toBe('string');
  });
});
