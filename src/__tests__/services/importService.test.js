import { describe, it, expect } from 'vitest';
import { parseTransactionCsv, parseCsv } from '../../services/importService';

// ── Test helpers ─────────────────────────────────────────────────────

const WALLETS = [
  { id: 'w1', name: 'Jago - Main' },
  { id: 'w2', name: 'BRI - A' },
  { id: 'w3', name: 'GoPay - A' },
  { id: 'w4', name: 'Cash' },
  { id: 'w5', name: 'Super Bank' },
];

const CATEGORIES = [
  { id: 'c1', name: 'Makan', section: 'needs', color: '#F59E0B' },
  { id: 'c2', name: 'Gaji', section: 'income', color: '#6366F1' },
];

function makeCsv(rows) {
  const header = 'Tanggal,Tipe,Jumlah,Kategori,Sub Kategori,Dompet,Ke Dompet,Catatan';
  return [header, ...rows].join('\n');
}

// ── parseCsv ─────────────────────────────────────────────────────────

describe('parseCsv', () => {
  it('parses basic CSV with headers', () => {
    const csv = 'A,B\n1,2\n3,4';
    const result = parseCsv(csv);
    expect(result).toEqual([
      { A: '1', B: '2' },
      { A: '3', B: '4' },
    ]);
  });

  it('handles UTF-8 BOM', () => {
    const csv = '\uFEFFA,B\n1,2';
    const result = parseCsv(csv);
    expect(result).toEqual([{ A: '1', B: '2' }]);
  });

  it('returns empty array for empty input', () => {
    expect(parseCsv('')).toEqual([]);
  });
});

// ── parseTransactionCsv ──────────────────────────────────────────────

describe('parseTransactionCsv', () => {
  it('parses expense rows correctly', () => {
    const csv = makeCsv([
      '2026-05-03,EXPENSE,38000,Kebutuhan,Makan,Jago - Main,,Makan malam',
    ]);
    const result = parseTransactionCsv(csv, WALLETS, CATEGORIES);

    expect(result.transactions).toHaveLength(1);
    expect(result.newCategories).toHaveLength(0);

    const tx = result.transactions[0];
    expect(tx.date).toBe('2026-05-03');
    expect(tx.type).toBe('expense');
    expect(tx.amount).toBe(38000);
    expect(tx.walletId).toBe('w1'); // Jago - Main
    expect(tx.categoryId).toBe('c1'); // Makan (existing)
    expect(tx.note).toBe('Makan malam');
    expect(tx.tags).toEqual([]);
    expect(tx.toWalletId).toBeNull();
    expect(tx.id).toMatch(/^tx_/);
  });

  it('parses transfer rows correctly', () => {
    const csv = makeCsv([
      '2026-05-03,TRANSFER,208624,,,Jago - Main,BRI - A,',
    ]);
    const result = parseTransactionCsv(csv, WALLETS, CATEGORIES);

    const tx = result.transactions[0];
    expect(tx.type).toBe('transfer');
    expect(tx.walletId).toBe('w1');
    expect(tx.toWalletId).toBe('w2');
    expect(tx.categoryId).toBeNull();
    expect(tx.amount).toBe(208624);
  });

  it('parses income rows correctly', () => {
    const csv = makeCsv([
      '2026-04-24,INCOME,14076431,Pemasukan,Gaji,BRI - A,,',
    ]);
    const result = parseTransactionCsv(csv, WALLETS, CATEGORIES);

    const tx = result.transactions[0];
    expect(tx.type).toBe('income');
    expect(tx.walletId).toBe('w2');
    expect(tx.categoryId).toBe('c2'); // Gaji (existing)
    expect(tx.amount).toBe(14076431);
  });

  it('auto-creates new categories from Sub Kategori', () => {
    const csv = makeCsv([
      '2026-05-03,EXPENSE,200000,Kebutuhan,IPL Komplek,Jago - Main,,',
      '2026-05-03,EXPENSE,30000,Keinginan,Jajan,Jago - Main,,Cimol',
    ]);
    const result = parseTransactionCsv(csv, WALLETS, CATEGORIES);

    expect(result.newCategories).toHaveLength(2);

    const iplCat = result.newCategories.find((c) => c.name === 'IPL Komplek');
    expect(iplCat).toBeDefined();
    expect(iplCat.section).toBe('needs');
    expect(iplCat.color).toMatch(/^#/);

    const jajanCat = result.newCategories.find((c) => c.name === 'Jajan');
    expect(jajanCat).toBeDefined();
    expect(jajanCat.section).toBe('wants');

    // Transactions should reference the new category IDs
    expect(result.transactions[0].categoryId).toBe(iplCat.id);
    expect(result.transactions[1].categoryId).toBe(jajanCat.id);
  });

  it('reuses the same new category for duplicate Sub Kategori entries', () => {
    const csv = makeCsv([
      '2026-05-01,EXPENSE,61000,Keinginan,Jajan,Jago - Main,,Coffee',
      '2026-04-29,EXPENSE,3000,Keinginan,Jajan,Cash,,????',
    ]);
    const result = parseTransactionCsv(csv, WALLETS, CATEGORIES);

    // Only one new category should be created
    expect(result.newCategories).toHaveLength(1);
    expect(result.newCategories[0].name).toBe('Jajan');

    // Both transactions should reference the same category
    expect(result.transactions[0].categoryId).toBe(result.transactions[1].categoryId);
  });

  it('matches existing categories case-insensitively', () => {
    const csv = makeCsv([
      '2026-05-03,EXPENSE,38000,Kebutuhan,makan,Jago - Main,,',
    ]);
    const result = parseTransactionCsv(csv, WALLETS, CATEGORIES);

    expect(result.newCategories).toHaveLength(0);
    expect(result.transactions[0].categoryId).toBe('c1'); // matches "Makan"
  });

  it('throws error for unmatched wallet names', () => {
    const csv = makeCsv([
      '2026-05-03,EXPENSE,38000,Kebutuhan,Makan,Unknown Wallet,,',
    ]);
    expect(() => parseTransactionCsv(csv, WALLETS, CATEGORIES)).toThrow(
      /Dompet tidak ditemukan.*Unknown Wallet/
    );
  });

  it('throws error for unmatched Ke Dompet in transfers', () => {
    const csv = makeCsv([
      '2026-05-03,TRANSFER,100000,,,Jago - Main,Missing Wallet,',
    ]);
    expect(() => parseTransactionCsv(csv, WALLETS, CATEGORIES)).toThrow(
      /Dompet tidak ditemukan.*Missing Wallet/
    );
  });

  it('throws error for empty CSV', () => {
    expect(() => parseTransactionCsv('', WALLETS, CATEGORIES)).toThrow(
      /kosong/
    );
  });

  it('throws error for CSV with missing required columns', () => {
    const csv = 'Name,Value\nfoo,bar';
    expect(() => parseTransactionCsv(csv, WALLETS, CATEGORIES)).toThrow(
      /Kolom CSV tidak lengkap/
    );
  });

  it('maps Penyesuaian Saldo to income section', () => {
    const csv = makeCsv([
      '2026-04-06,INCOME,5906,Penyesuaian Saldo,Penyesuaian Saldo,Jago - Main,,ada perubahan',
    ]);
    const result = parseTransactionCsv(csv, WALLETS, CATEGORIES);

    const newCat = result.newCategories.find((c) => c.name === 'Penyesuaian Saldo');
    expect(newCat).toBeDefined();
    expect(newCat.section).toBe('income');
  });

  it('maps Tabungan to savings section', () => {
    const csv = makeCsv([
      '2026-04-09,EXPENSE,15000000,Tabungan,Deposito,Super Bank,,Penempatan Deposito',
    ]);
    const result = parseTransactionCsv(csv, WALLETS, CATEGORIES);

    const newCat = result.newCategories.find((c) => c.name === 'Deposito');
    expect(newCat).toBeDefined();
    expect(newCat.section).toBe('savings');
  });

  it('handles multiple rows with mixed types', () => {
    const csv = makeCsv([
      '2026-05-03,EXPENSE,38000,Kebutuhan,Makan,Jago - Main,,Makan malam',
      '2026-05-03,TRANSFER,208624,,,Jago - Main,BRI - A,',
      '2026-04-24,INCOME,14076431,Pemasukan,Gaji,BRI - A,,',
    ]);
    const result = parseTransactionCsv(csv, WALLETS, CATEGORIES);

    expect(result.transactions).toHaveLength(3);
    expect(result.transactions[0].type).toBe('expense');
    expect(result.transactions[1].type).toBe('transfer');
    expect(result.transactions[2].type).toBe('income');
  });

  it('generates unique transaction IDs', () => {
    const csv = makeCsv([
      '2026-05-03,EXPENSE,38000,Kebutuhan,Makan,Jago - Main,,A',
      '2026-05-03,EXPENSE,30000,Kebutuhan,Makan,Jago - Main,,B',
    ]);
    const result = parseTransactionCsv(csv, WALLETS, CATEGORIES);

    const ids = result.transactions.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
