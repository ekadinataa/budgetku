/**
 * Debt Helpers — Pure computation functions for debt management.
 *
 * Provides helpers for computing summaries, filtering, sorting,
 * due date logic, payment processing, and transaction generation.
 */

/**
 * Compute summary values from a list of debt records.
 * @param {Array} debts - All debt records
 * @returns {{ totalUtang: number, totalPiutang: number, netPosition: number }}
 */
export function computeDebtSummary(debts) {
  let totalUtang = 0;
  let totalPiutang = 0;

  for (const d of debts) {
    if (d.status !== 'active') continue;
    if (d.type === 'utang') {
      totalUtang += d.remainingAmount;
    } else if (d.type === 'piutang') {
      totalPiutang += d.remainingAmount;
    }
  }

  return {
    totalUtang,
    totalPiutang,
    netPosition: totalPiutang - totalUtang,
  };
}

/**
 * Filter debts by type and/or status.
 * @param {Array} debts - All debt records
 * @param {{ type?: 'utang'|'piutang', status?: 'active'|'settled' }} filters
 * @returns {Array} Filtered records
 */
export function filterDebts(debts, filters = {}) {
  let result = debts;
  if (filters.type) {
    result = result.filter((d) => d.type === filters.type);
  }
  if (filters.status) {
    result = result.filter((d) => d.status === filters.status);
  }
  return result;
}

/**
 * Sort debts by createdAt descending.
 * @param {Array} debts
 * @returns {Array} Sorted copy
 */
export function sortDebtsByDate(debts) {
  return [...debts].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

/**
 * Get debts with due dates within the next N days (upcoming).
 * @param {Array} debts - Active debt records
 * @param {string} today - Today's date in "YYYY-MM-DD" format
 * @param {number} [days=7] - Number of days to look ahead
 * @returns {Array} Upcoming debts
 */
export function getUpcomingDebts(debts, today, days = 7) {
  return debts.filter((d) => {
    if (d.status !== 'active' || !d.dueDate) return false;
    const diff = getDaysUntilDue(d.dueDate, today);
    return diff >= 0 && diff <= days;
  });
}

/**
 * Get overdue debts (due date passed, still active).
 * @param {Array} debts - Active debt records
 * @param {string} today - Today's date in "YYYY-MM-DD" format
 * @returns {Array} Overdue debts
 */
export function getOverdueDebts(debts, today) {
  return debts.filter((d) => {
    if (d.status !== 'active' || !d.dueDate) return false;
    return getDaysUntilDue(d.dueDate, today) < 0;
  });
}

/**
 * Compute days until due date from today.
 * @param {string} dueDate - Due date in "YYYY-MM-DD" format
 * @param {string} today - Today's date in "YYYY-MM-DD" format
 * @returns {number} Days until due (negative if overdue)
 */
export function getDaysUntilDue(dueDate, today) {
  const due = new Date(dueDate + 'T00:00:00');
  const now = new Date(today + 'T00:00:00');
  const diff = due.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Compute net worth including debts.
 * @param {Array} wallets - All wallets
 * @param {Array} debts - All debt records
 * @returns {number} Net worth = total wallet balance - active utang + active piutang
 */
export function computeNetWorth(wallets, debts) {
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  const { totalUtang, totalPiutang } = computeDebtSummary(debts);
  return totalBalance - totalUtang + totalPiutang;
}

/**
 * Process a payment against a debt record (pure function).
 * Returns the updated debt record without side effects.
 * @param {Object} debt - Current debt record
 * @param {{ amount: number, date: string, note?: string }} payment - Payment data
 * @returns {Object} Updated debt record with new remainingAmount, payments, and status
 */
export function applyPayment(debt, payment) {
  const newRemaining = debt.remainingAmount - payment.amount;
  const newPayment = {
    amount: payment.amount,
    date: payment.date,
    note: payment.note || '',
    transactionId: payment.transactionId || '',
  };
  const newPayments = [...(debt.payments || []), newPayment];
  const newStatus = newRemaining <= 0 ? 'settled' : 'active';

  return {
    ...debt,
    remainingAmount: Math.max(0, newRemaining),
    payments: newPayments,
    status: newStatus,
  };
}

/**
 * Build the transaction data object for a debt operation.
 * @param {'create'|'payment'} operation - Type of operation
 * @param {Object} debt - The debt record
 * @param {number} amount - Transaction amount
 * @param {string} walletId - Target wallet ID
 * @returns {{ type: string, amount: number, walletId: string, note: string, tags: string[], categoryId: null, date: string }}
 */
export function buildDebtTransaction(operation, debt, amount, walletId) {
  const today = new Date().toISOString().slice(0, 10);
  let type;
  let note;

  if (operation === 'create') {
    // utang creation → income (money received), piutang creation → expense (money lent out)
    type = debt.type === 'utang' ? 'income' : 'expense';
    note = debt.type === 'utang'
      ? `Utang dari ${debt.personName}`
      : `Piutang ke ${debt.personName}`;
  } else {
    // utang payment → expense (paying back), piutang payment → income (receiving back)
    type = debt.type === 'utang' ? 'expense' : 'income';
    note = debt.type === 'utang'
      ? `Bayar utang ke ${debt.personName}`
      : `Terima piutang dari ${debt.personName}`;
  }

  return {
    date: today,
    walletId,
    type,
    categoryId: null,
    amount,
    note,
    tags: ['utang-piutang'],
  };
}

// ── Annuity / Interest Calculations ──────────────────────────────────

/**
 * Calculate monthly annuity installment amount.
 * M = P × [r(1+r)^n] / [(1+r)^n - 1]
 *
 * @param {number} principal - Loan principal amount
 * @param {number} annualRate - Annual interest rate as percentage (e.g. 8 for 8%)
 * @param {number} tenorMonths - Number of months
 * @returns {number} Monthly installment amount (rounded)
 */
export function calcAnnuityInstallment(principal, annualRate, tenorMonths) {
  if (tenorMonths <= 0 || principal <= 0) return 0;
  if (annualRate <= 0) return Math.round(principal / tenorMonths);

  const r = annualRate / 100 / 12; // Monthly rate
  const n = tenorMonths;
  const factor = Math.pow(1 + r, n);
  const installment = principal * (r * factor) / (factor - 1);
  return Math.round(installment);
}

/**
 * Generate full amortization schedule for an annuity loan.
 *
 * @param {number} principal - Loan principal
 * @param {number} annualRate - Annual interest rate (%)
 * @param {number} tenorMonths - Number of months
 * @param {string} startDate - Start date "YYYY-MM-DD" (first payment is 1 month after)
 * @returns {Array<{ month: number, date: string, principal: number, interest: number, total: number, remainingPrincipal: number }>}
 */
export function generateAmortizationSchedule(principal, annualRate, tenorMonths, startDate) {
  if (tenorMonths <= 0 || principal <= 0) return [];

  const monthlyInstallment = calcAnnuityInstallment(principal, annualRate, tenorMonths);
  const r = annualRate / 100 / 12;
  const schedule = [];
  let remaining = principal;

  for (let i = 1; i <= tenorMonths; i++) {
    const interest = Math.round(remaining * r);
    // Last month: principal = remaining (to avoid rounding drift)
    const principalPart = i === tenorMonths ? remaining : Math.round(monthlyInstallment - interest);
    const total = principalPart + interest;

    remaining = Math.max(0, remaining - principalPart);

    // Calculate payment date (startDate + i months)
    const payDate = addMonths(startDate, i);

    schedule.push({
      month: i,
      date: payDate,
      principal: principalPart,
      interest,
      total,
      remainingPrincipal: remaining,
    });
  }

  return schedule;
}

/**
 * Get the current installment info based on how many payments have been made.
 *
 * @param {Object} debt - Debt record with interestEnabled, schedule, payments
 * @returns {{ month: number, principal: number, interest: number, total: number, remainingPrincipal: number } | null}
 */
export function getCurrentInstallmentInfo(debt) {
  // Support both explicit flag and legacy data with interest fields
  const hasInterest = debt.interestEnabled || (debt.interestRate > 0 && debt.tenorMonths > 0);
  if (!hasInterest) return null;

  // If schedule exists, use it directly
  if (debt.schedule && debt.schedule.length > 0) {
    const paidCount = (debt.payments || []).length;
    if (paidCount >= debt.schedule.length) return null;
    return debt.schedule[paidCount];
  }

  // Fallback: generate schedule on the fly for legacy data without stored schedule
  if (debt.totalAmount > 0 && debt.tenorMonths > 0 && debt.interestRate > 0) {
    const schedule = generateAmortizationSchedule(
      debt.totalAmount, debt.interestRate, debt.tenorMonths, debt.startDate || debt.createdAt || ''
    );
    if (schedule.length === 0) return null;
    const paidCount = (debt.payments || []).length;
    if (paidCount >= schedule.length) return null;
    return schedule[paidCount];
  }

  return null;
}

/**
 * Calculate total interest to be paid over the loan lifetime.
 *
 * @param {number} principal - Loan principal
 * @param {number} annualRate - Annual interest rate (%)
 * @param {number} tenorMonths - Number of months
 * @returns {number} Total interest
 */
export function calcTotalInterest(principal, annualRate, tenorMonths) {
  const installment = calcAnnuityInstallment(principal, annualRate, tenorMonths);
  return (installment * tenorMonths) - principal;
}

/**
 * Add N months to a date string.
 * @param {string} dateStr - "YYYY-MM-DD"
 * @param {number} months - Number of months to add
 * @returns {string} New date "YYYY-MM-DD"
 */
function addMonths(dateStr, months) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
