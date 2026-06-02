/**
 * Recurring Items utility functions.
 *
 * Provides helpers for calculating amortized costs, estimating restock dates,
 * and grouping recurring items by status.
 */

/**
 * Calculate the amortized monthly cost of a recurring item.
 * @param {number} amount - Purchase price
 * @param {number} durationDays - How many days the item lasts
 * @returns {number} Monthly cost (30-day basis)
 */
export function getAmortizedMonthlyCost(amount, durationDays) {
  if (!durationDays || durationDays <= 0) return 0;
  return (amount / durationDays) * 30;
}

/**
 * Calculate the total amortized monthly cost for all active recurring items.
 * @param {Array} items - Array of recurring items
 * @returns {number} Total monthly amortized cost
 */
export function getTotalAmortizedCost(items) {
  return items
    .filter((item) => item.isActive)
    .reduce((total, item) => total + getAmortizedMonthlyCost(item.amount, item.durationDays), 0);
}

/**
 * Get amortized cost breakdown by category.
 * @param {Array} items - Array of recurring items
 * @param {Array} categories - Array of category objects
 * @returns {Array} Array of { categoryId, categoryName, color, monthlyCost }
 */
export function getAmortizedByCategory(items, categories) {
  const map = {};
  items.filter((i) => i.isActive).forEach((item) => {
    const monthly = getAmortizedMonthlyCost(item.amount, item.durationDays);
    const catId = item.categoryId || 'uncategorized';
    if (!map[catId]) {
      const cat = categories.find((c) => c.id === catId);
      map[catId] = {
        categoryId: catId,
        categoryName: cat?.name || 'Lainnya',
        color: cat?.color || '#94A3B8',
        section: cat?.section || 'needs',
        monthlyCost: 0,
      };
    }
    map[catId].monthlyCost += monthly;
  });
  return Object.values(map).sort((a, b) => b.monthlyCost - a.monthlyCost);
}

/**
 * Get amortized cost breakdown by budget section (needs/wants/savings).
 * @param {Array} items - Array of recurring items
 * @param {Array} categories - Array of category objects
 * @returns {{ needs: number, wants: number, savings: number }}
 */
export function getAmortizedBySection(items, categories) {
  const result = { needs: 0, wants: 0, savings: 0 };
  items.filter((i) => i.isActive).forEach((item) => {
    const monthly = getAmortizedMonthlyCost(item.amount, item.durationDays);
    const cat = categories.find((c) => c.id === item.categoryId);
    const section = cat?.section || 'needs';
    if (result[section] !== undefined) {
      result[section] += monthly;
    }
  });
  return result;
}

/**
 * Calculate the estimated next purchase date.
 * @param {string} lastPurchaseDate - YYYY-MM-DD format
 * @param {number} durationDays - Duration in days
 * @returns {string} YYYY-MM-DD of estimated next purchase
 */
export function calcNextEstimateDate(lastPurchaseDate, durationDays) {
  if (!lastPurchaseDate || !durationDays) return '';
  const d = new Date(lastPurchaseDate + 'T00:00:00');
  d.setDate(d.getDate() + durationDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Calculate remaining days until restock is needed.
 * @param {string} nextEstimateDate - YYYY-MM-DD format
 * @param {string} [today] - Optional today date string for testing
 * @returns {number} Days remaining (negative means overdue)
 */
export function getDaysRemaining(nextEstimateDate, today) {
  if (!nextEstimateDate) return Infinity;
  const todayStr = today || new Date().toISOString().slice(0, 10);
  const nextDate = new Date(nextEstimateDate + 'T00:00:00');
  const todayDate = new Date(todayStr + 'T00:00:00');
  const diff = nextDate.getTime() - todayDate.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Group recurring items by status: needsRestock, available, inactive.
 * @param {Array} items - Array of recurring items
 * @param {number} [restockThresholdDays=7] - Days threshold for "needs restock"
 * @returns {{ needsRestock: Array, available: Array, inactive: Array }}
 */
export function groupByStatus(items, restockThresholdDays = 7) {
  const needsRestock = [];
  const available = [];
  const inactive = [];

  items.forEach((item) => {
    if (!item.isActive) {
      inactive.push(item);
      return;
    }
    const daysLeft = getDaysRemaining(item.nextEstimateDate);
    if (daysLeft <= restockThresholdDays) {
      needsRestock.push({ ...item, _daysLeft: daysLeft });
    } else {
      available.push({ ...item, _daysLeft: daysLeft });
    }
  });

  // Sort: most urgent first
  needsRestock.sort((a, b) => a._daysLeft - b._daysLeft);
  available.sort((a, b) => a._daysLeft - b._daysLeft);

  return { needsRestock, available, inactive };
}

/**
 * Convert duration shortcut to days.
 * @param {string} shortcut - e.g. '1bln', '1.5bln', '2bln', '3bln', '6bln'
 * @returns {number} Days
 */
export function shortcutToDays(shortcut) {
  const map = {
    '2mgg': 14,
    '1bln': 30,
    '1.5bln': 45,
    '2bln': 60,
    '3bln': 90,
    '6bln': 180,
    '1thn': 365,
  };
  return map[shortcut] || 0;
}

/**
 * Format days remaining into a human-readable Indonesian string.
 * @param {number} days - Days remaining
 * @returns {string} e.g. "3 hari lagi", "hari ini", "terlambat 2 hari"
 */
export function formatDaysRemaining(days) {
  if (days === 0) return 'hari ini';
  if (days === 1) return 'besok';
  if (days > 0) return `${days} hari lagi`;
  return `terlambat ${Math.abs(days)} hari`;
}

/**
 * Format duration days to a readable label.
 * @param {number} days - Duration in days
 * @returns {string} e.g. "1.5 bulan", "2 minggu", "90 hari"
 */
export function formatDuration(days) {
  if (days >= 30 && days % 30 === 0) return `${days / 30} bulan`;
  if (days === 45) return '1.5 bulan';
  if (days === 14) return '2 minggu';
  if (days === 7) return '1 minggu';
  if (days >= 30) return `${(days / 30).toFixed(1)} bulan`;
  return `${days} hari`;
}
