/**
 * Helper utility functions for BudgetKu.
 *
 * Includes lookup helpers, label/color mappers, billing cycle period range
 * computation, transaction filtering/grouping, and wallet aggregate utilities.
 *
 * Requirements: 7.6, 7.7
 */

/**
 * Find a category by ID.
 *
 * @param {string} id - Category ID
 * @param {Array} categories - Array of Category objects
 * @returns {object|undefined} The matching Category or undefined
 */
export function getCatById(id, categories) {
  return categories.find((c) => c.id === id);
}

/**
 * Find a wallet by ID.
 *
 * @param {string} id - Wallet ID
 * @param {Array} wallets - Array of Wallet objects
 * @returns {object|undefined} The matching Wallet or undefined
 */
export function getWalletById(id, wallets) {
  return wallets.find((w) => w.id === id);
}

/**
 * Return the Indonesian display label for a wallet type.
 *
 * @param {string} type - One of 'bank', 'ewallet', 'credit', 'paylater', 'cash'
 * @returns {string} Human-readable label
 */
export function walletTypeLabel(type) {
  const map = {
    bank: 'Bank',
    ewallet: 'E-Wallet',
    credit: 'Kartu Kredit',
    paylater: 'PayLater',
    cash: 'Tunai/Cash',
  };
  return map[type] || type;
}

/**
 * Return the Indonesian label for a budget section.
 *
 * @param {string} s - One of 'needs', 'wants', 'savings', 'income'
 * @returns {string} Indonesian label
 */
export function sectionLabel(s) {
  const map = {
    needs: 'Kebutuhan',
    wants: 'Keinginan',
    savings: 'Tabungan',
    income: 'Pemasukan',
  };
  return map[s] || s;
}

/**
 * Return the hex color for a budget section.
 *
 * @param {string} s - One of 'needs', 'wants', 'savings'
 * @returns {string} Hex color string
 */
export function sectionColor(s) {
  const map = {
    needs: '#4F6EF7',
    wants: '#F59E0B',
    savings: '#22C55E',
  };
  return map[s] || '#A855F7';
}

/**
 * Compute the billing cycle date range for a given month key and cycle start day.
 *
 * When cycleStart <= 1, the range is the first to last day of the given month.
 * Otherwise, the range starts on cycleStart of the previous month and ends on
 * cycleStart-1 of the current month.
 *
 * @param {string} refMk - Month key in "YYYY-MM" format
 * @param {number} cycleStart - Cycle start day (1–28)
 * @returns {{ start: string, end: string, label: string }} Date range and label
 */
export function getPeriodRange(refMk, cycleStart) {
  const [y, m] = refMk.split('-').map(Number);

  if (cycleStart <= 1) {
    const lastDay = new Date(y, m, 0).getDate();
    return {
      start: `${refMk}-01`,
      end: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
      label: new Date(y, m - 1, 1).toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
      }),
    };
  }

  // e.g. cycleStart=25, Apr → 25 Mar – 24 Apr
  const prevM = m === 1 ? 12 : m - 1;
  const prevY = m === 1 ? y - 1 : y;
  const endDay = Math.min(cycleStart - 1, new Date(y, m, 0).getDate());
  const startDay = Math.min(cycleStart, new Date(prevY, prevM, 0).getDate());

  const startStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
  const endStr = `${y}-${String(m).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

  const startFmt = new Date(startStr + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
  const endFmt = new Date(endStr + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return { start: startStr, end: endStr, label: `${startFmt} – ${endFmt}` };
}

/**
 * Filter transactions whose date falls within [start, end] inclusive.
 *
 * @param {Array} txs - Array of Transaction objects (each with a `date` string)
 * @param {{ start: string, end: string }} range - Date range
 * @returns {Array} Filtered transactions
 */
export function filterByRange(txs, range) {
  return txs.filter((t) => t.date >= range.start && t.date <= range.end);
}

/**
 * Group transactions by date, producing an array of { date, transactions } objects
 * sorted by date descending. Transactions within each group preserve their order.
 *
 * @param {Array} txs - Array of Transaction objects sorted by date descending
 * @returns {Array<{ date: string, transactions: Array }>} Grouped transactions
 */
export function groupTransactionsByDate(txs) {
  const groups = [];
  let lastDate = null;
  let currentGroup = null;

  for (const t of txs) {
    if (t.date !== lastDate) {
      currentGroup = { date: t.date, transactions: [] };
      groups.push(currentGroup);
      lastDate = t.date;
    }
    currentGroup.transactions.push(t);
  }

  return groups;
}

/**
 * Get the most recent non-transfer transactions, up to `limit` items,
 * sorted by date descending.
 *
 * @param {Array} txs - Array of Transaction objects
 * @param {number} [limit=6] - Maximum number of transactions to return
 * @returns {Array} Recent non-transfer transactions
 */
export function getRecentTransactions(txs, limit = 6) {
  return [...txs]
    .filter((t) => t.type !== 'transfer')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

/**
 * Compute wallet aggregate values: net balance, total assets, and total debt.
 *
 * @param {Array} wallets - Array of Wallet objects
 * @returns {{ netBalance: number, totalAsset: number, totalDebt: number }}
 */
export function computeWalletAggregates(wallets) {
  let netBalance = 0;
  let totalAsset = 0;
  let totalDebt = 0;

  for (const w of wallets) {
    netBalance += w.balance;
    if (w.balance >= 0) {
      totalAsset += w.balance;
    } else {
      totalDebt += w.balance;
    }
  }

  return { netBalance, totalAsset, totalDebt };
}

/**
 * Filter categories by transaction type.
 * Income-type transactions get only income-section categories.
 * Expense-type transactions get only non-income-section categories.
 *
 * @param {Array} categories - Array of Category objects
 * @param {string} txType - 'income' or 'expense'
 * @returns {Array} Filtered categories
 */
export function filterCategoriesByTxType(categories, txType) {
  if (txType === 'income') {
    return categories.filter((c) => c.section === 'income');
  }
  return categories.filter((c) => c.section !== 'income');
}
