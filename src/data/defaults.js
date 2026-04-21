// ── Default Data ─────────────────────────────────────────────────────────────
// Matches the prototype's data.js — wallets, transactions, budgets, categories

const today = new Date();
export const TODAY = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

export const WALLETS_INIT = [
  { id: 'w1', name: 'BCA', type: 'bank', balance: 8500000, color: '#2563EB', note: '7890' },
  { id: 'w2', name: 'GoPay', type: 'ewallet', balance: 350000, color: '#00AED6', note: '' },
  { id: 'w3', name: 'OVO', type: 'ewallet', balance: 125000, color: '#4C2A86', note: '' },
  { id: 'w4', name: 'BNI', type: 'bank', balance: 2200000, color: '#F97316', note: '1234' },
  { id: 'w5', name: 'Tunai', type: 'cash', balance: 400000, color: '#16A34A', note: '' },
  { id: 'w6', name: 'Kredivo', type: 'paylater', balance: -750000, color: '#DC2626', note: '' },
];

export const CATEGORIES = [
  { id: 'c1', name: 'Makanan & Minum', section: 'needs', color: '#F59E0B' },
  { id: 'c2', name: 'Transport', section: 'needs', color: '#3B82F6' },
  { id: 'c3', name: 'Utilitas', section: 'needs', color: '#8B5CF6' },
  { id: 'c4', name: 'Kesehatan', section: 'needs', color: '#EF4444' },
  { id: 'c5', name: 'Pendidikan', section: 'needs', color: '#06B6D4' },
  { id: 'c6', name: 'Belanja Bulanan', section: 'needs', color: '#EC4899' },
  { id: 'c7', name: 'Hiburan', section: 'wants', color: '#F97316' },
  { id: 'c8', name: 'Makan di Luar', section: 'wants', color: '#EAB308' },
  { id: 'c9', name: 'Fashion', section: 'wants', color: '#A855F7' },
  { id: 'c10', name: 'Langganan', section: 'wants', color: '#14B8A6' },
  { id: 'c11', name: 'Hobi', section: 'wants', color: '#64748B' },
  { id: 'c12', name: 'Dana Darurat', section: 'savings', color: '#22C55E' },
  { id: 'c13', name: 'Investasi', section: 'savings', color: '#10B981' },
  { id: 'c14', name: 'Dana Pensiun', section: 'savings', color: '#059669' },
  { id: 'c15', name: 'Gaji', section: 'income', color: '#6366F1' },
  { id: 'c16', name: 'Freelance', section: 'income', color: '#8B5CF6' },
  { id: 'c17', name: 'Hasil Investasi', section: 'income', color: '#10B981' },
  { id: 'c18', name: 'Lainnya', section: 'income', color: '#94A3B8' },
];


export const TRANSACTIONS_INIT = [
  // April income
  { id: 't1', date: '2026-04-01', walletId: 'w1', type: 'income', categoryId: 'c15', amount: 12000000, note: 'Gaji April', tags: ['rutin'] },
  { id: 't2', date: '2026-04-05', walletId: 'w1', type: 'income', categoryId: 'c16', amount: 1500000, note: 'Freelance logo design', tags: ['freelance'] },
  // April expenses
  { id: 't3', date: '2026-04-02', walletId: 'w1', type: 'expense', categoryId: 'c6', amount: 850000, note: 'Belanja bulanan Indomaret', tags: ['rutin'] },
  { id: 't4', date: '2026-04-03', walletId: 'w2', type: 'expense', categoryId: 'c1', amount: 65000, note: 'Makan siang GoFood', tags: ['makan'] },
  { id: 't5', date: '2026-04-04', walletId: 'w5', type: 'expense', categoryId: 'c1', amount: 45000, note: 'Sarapan warung', tags: ['makan'] },
  { id: 't6', date: '2026-04-05', walletId: 'w1', type: 'expense', categoryId: 'c3', amount: 450000, note: 'Listrik & Air April', tags: ['rutin'] },
  { id: 't7', date: '2026-04-06', walletId: 'w3', type: 'expense', categoryId: 'c10', amount: 79000, note: 'Netflix bulan ini', tags: ['langganan'] },
  { id: 't8', date: '2026-04-07', walletId: 'w2', type: 'expense', categoryId: 'c2', amount: 35000, note: 'Ojek online', tags: ['transport'] },
  { id: 't9', date: '2026-04-08', walletId: 'w1', type: 'expense', categoryId: 'c13', amount: 1000000, note: 'Reksa dana bulanan', tags: ['rutin', 'investasi'] },
  { id: 't10', date: '2026-04-09', walletId: 'w5', type: 'expense', categoryId: 'c1', amount: 120000, note: 'Makan malam keluarga', tags: ['makan'] },
  { id: 't11', date: '2026-04-10', walletId: 'w1', type: 'expense', categoryId: 'c5', amount: 500000, note: 'Kursus online Coursera', tags: ['edu'] },
  { id: 't12', date: '2026-04-11', walletId: 'w6', type: 'expense', categoryId: 'c9', amount: 450000, note: 'Baju Zara', tags: ['fashion'] },
  { id: 't13', date: '2026-04-12', walletId: 'w2', type: 'expense', categoryId: 'c8', amount: 185000, note: 'Dinner KBBQ', tags: ['makan', 'hangout'] },
  { id: 't14', date: '2026-04-13', walletId: 'w1', type: 'expense', categoryId: 'c2', amount: 600000, note: 'Bensin + Tol bulan ini', tags: ['rutin'] },
  { id: 't15', date: '2026-04-14', walletId: 'w3', type: 'expense', categoryId: 'c7', amount: 130000, note: 'Bioskop', tags: ['hiburan'] },
  { id: 't16', date: '2026-04-15', walletId: 'w1', type: 'expense', categoryId: 'c12', amount: 1000000, note: 'Dana darurat transfer', tags: ['rutin'] },
  { id: 't17', date: '2026-04-16', walletId: 'w5', type: 'expense', categoryId: 'c1', amount: 55000, note: 'Kopi & snack kantor', tags: ['makan'] },
  { id: 't18', date: '2026-04-17', walletId: 'w2', type: 'expense', categoryId: 'c4', amount: 250000, note: 'Apotek & vitamin', tags: ['kesehatan'] },
  { id: 't19', date: '2026-04-18', walletId: 'w1', type: 'expense', categoryId: 'c11', amount: 320000, note: 'Buku & alat gambar', tags: ['hobi'] },
  { id: 't20', date: '2026-04-19', walletId: 'w5', type: 'expense', categoryId: 'c1', amount: 35000, note: 'Sarapan nasi uduk', tags: ['makan'] },
  // Transfers
  { id: 't21', date: '2026-04-10', walletId: 'w1', type: 'transfer', categoryId: null, amount: 200000, note: 'Top up GoPay', tags: [], toWalletId: 'w2' },
  { id: 't22', date: '2026-04-15', walletId: 'w1', type: 'transfer', categoryId: null, amount: 100000, note: 'Penarikan tunai', tags: [], toWalletId: 'w5' },
  // March transactions (for reports comparison)
  { id: 't30', date: '2026-03-01', walletId: 'w1', type: 'income', categoryId: 'c15', amount: 12000000, note: 'Gaji Maret', tags: ['rutin'] },
  { id: 't31', date: '2026-03-03', walletId: 'w1', type: 'expense', categoryId: 'c6', amount: 920000, note: 'Belanja bulanan', tags: ['rutin'] },
  { id: 't32', date: '2026-03-05', walletId: 'w1', type: 'expense', categoryId: 'c3', amount: 420000, note: 'Listrik & Air', tags: ['rutin'] },
  { id: 't33', date: '2026-03-08', walletId: 'w2', type: 'expense', categoryId: 'c1', amount: 95000, note: 'Makan GoFood', tags: ['makan'] },
  { id: 't34', date: '2026-03-10', walletId: 'w1', type: 'expense', categoryId: 'c13', amount: 1000000, note: 'Reksa dana', tags: ['investasi'] },
  { id: 't35', date: '2026-03-12', walletId: 'w6', type: 'expense', categoryId: 'c9', amount: 650000, note: 'Sepatu Nike', tags: ['fashion'] },
  { id: 't36', date: '2026-03-15', walletId: 'w1', type: 'expense', categoryId: 'c12', amount: 1000000, note: 'Dana darurat', tags: ['rutin'] },
  { id: 't37', date: '2026-03-18', walletId: 'w3', type: 'expense', categoryId: 'c10', amount: 79000, note: 'Netflix', tags: ['langganan'] },
  { id: 't38', date: '2026-03-20', walletId: 'w2', type: 'expense', categoryId: 'c8', amount: 230000, note: 'Makan bersama', tags: ['hangout'] },
  { id: 't39', date: '2026-03-22', walletId: 'w1', type: 'expense', categoryId: 'c2', amount: 580000, note: 'Bensin & Tol', tags: ['rutin'] },
  { id: 't40', date: '2026-03-25', walletId: 'w5', type: 'expense', categoryId: 'c1', amount: 280000, note: 'Belanja pasar', tags: ['makan'] },
  { id: 't41', date: '2026-03-28', walletId: 'w1', type: 'expense', categoryId: 'c7', amount: 200000, note: 'Game Steam', tags: ['hiburan'] },
  { id: 't42', date: '2026-03-30', walletId: 'w2', type: 'expense', categoryId: 'c4', amount: 180000, note: 'Dokter umum', tags: ['kesehatan'] },
];

export const BUDGETS_INIT = {
  '2026-04': {
    totalIncome: 12000000,
    sections: {
      needs: { total: 6000000, cats: [{ id: 'c1', amt: 1500000 }, { id: 'c2', amt: 800000 }, { id: 'c3', amt: 600000 }, { id: 'c4', amt: 500000 }, { id: 'c5', amt: 1200000 }, { id: 'c6', amt: 1400000 }] },
      wants: { total: 3600000, cats: [{ id: 'c7', amt: 500000 }, { id: 'c8', amt: 1000000 }, { id: 'c9', amt: 800000 }, { id: 'c10', amt: 300000 }, { id: 'c11', amt: 1000000 }] },
      savings: { total: 2400000, cats: [{ id: 'c12', amt: 1000000 }, { id: 'c13', amt: 1000000 }, { id: 'c14', amt: 400000 }] },
    },
  },
};