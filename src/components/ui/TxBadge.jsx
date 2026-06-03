/**
 * TxBadge — Colored badge with Indonesian transaction type labels.
 *
 * Displays a small colored badge indicating the transaction type:
 * - income → green "Pemasukan"
 * - expense → red "Pengeluaran"
 * - transfer → indigo "Transfer"
 *
 * Uses CSS custom properties for theme-aware light/dark colors.
 *
 * @param {Object} props
 * @param {'income'|'expense'|'transfer'} props.type - Transaction type
 *
 * Requirements: 4.9
 */
export default function TxBadge({ type }) {
  const map = {
    income: {
      bg: 'var(--tx-badge-income-bg, rgba(22, 163, 74, 0.1))',
      color: 'var(--tx-badge-income-color, #065F46)',
      label: 'Pemasukan',
    },
    expense: {
      bg: 'var(--tx-badge-expense-bg, rgba(220, 38, 38, 0.1))',
      color: 'var(--tx-badge-expense-color, #991B1B)',
      label: 'Pengeluaran',
    },
    transfer: {
      bg: 'var(--tx-badge-transfer-bg, rgba(99, 102, 241, 0.1))',
      color: 'var(--tx-badge-transfer-color, #3730A3)',
      label: 'Transfer',
    },
  };

  const s = map[type] || map.expense;

  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: 6,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {s.label}
    </span>
  );
}
