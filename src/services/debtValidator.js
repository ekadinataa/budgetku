/**
 * Debt Validator — Validation functions for debt and payment data.
 */

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate debt creation/edit data.
 * @param {Object} data - Debt form data
 * @param {boolean} [hasPayments=false] - Whether the record has existing payments
 * @returns {string|null} Error message or null if valid
 */
export function validateDebt(data, hasPayments = false) {
  if (!data.personName || typeof data.personName !== 'string' || data.personName.trim() === '') {
    return 'Nama orang wajib diisi';
  }

  if (!hasPayments) {
    if (!data.type || (data.type !== 'utang' && data.type !== 'piutang')) {
      return 'Tipe harus utang atau piutang';
    }
    if (typeof data.totalAmount !== 'number' || Number.isNaN(data.totalAmount) || data.totalAmount <= 0) {
      return 'Jumlah harus lebih dari 0';
    }
  }

  if (!data.walletId || typeof data.walletId !== 'string' || data.walletId.trim() === '') {
    return 'Dompet wajib dipilih';
  }

  if (data.dueDate && typeof data.dueDate === 'string' && data.dueDate !== '') {
    if (!DATE_REGEX.test(data.dueDate)) {
      return 'Format tanggal jatuh tempo tidak valid (YYYY-MM-DD)';
    }
  }

  return null;
}

/**
 * Validate payment data against a debt record.
 * @param {{ amount: number, date: string }} payment - Payment data
 * @param {number} remainingAmount - Current remaining amount on the debt
 * @returns {string|null} Error message or null if valid
 */
export function validatePayment(payment, remainingAmount) {
  if (typeof payment.amount !== 'number' || Number.isNaN(payment.amount) || payment.amount <= 0) {
    return 'Jumlah pembayaran harus lebih dari 0';
  }

  if (payment.amount > remainingAmount) {
    return 'Jumlah pembayaran melebihi sisa utang/piutang';
  }

  if (!payment.date || typeof payment.date !== 'string' || !DATE_REGEX.test(payment.date)) {
    return 'Tanggal pembayaran wajib diisi (format YYYY-MM-DD)';
  }

  return null;
}
