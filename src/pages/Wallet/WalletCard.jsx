import { fmtFull, fmt, monthKey } from '../../utils/formatters';
import { walletTypeLabel } from '../../utils/helpers';
import WalletIcon from '../../components/ui/WalletIcon';
import NavIcon from '../../components/icons/NavIcon';
import styles from './WalletPage.module.css';

/**
 * WalletCard — Displays a single wallet with gradient header, balance,
 * and monthly income/expense summary.
 *
 * @param {Object} props
 * @param {Object} props.wallet - Wallet object
 * @param {Array} props.transactions - All transactions
 * @param {Function} props.onEdit - Callback when edit button is clicked
 * @param {Function} props.onDelete - Callback when delete button is clicked
 *
 * Requirements: 3.2
 */
export default function WalletCard({ wallet: w, transactions, onEdit, onDelete }) {
  const mk = monthKey(new Date());
  const txs = transactions.filter(
    (t) => (t.walletId === w.id || t.toWalletId === w.id) && t.date.startsWith(mk)
  );
  const income = txs
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const expense = txs
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  // Month label abbreviation for footer
  const monthLabel = new Date().toLocaleDateString('id-ID', { month: 'short' });

  return (
    <div className={styles.walletCard}>
      <div
        className={styles.walletCardHeader}
        style={{
          background: `linear-gradient(135deg, ${w.color}ee, ${w.color}99)`,
        }}
      >
        <div className={styles.walletCardTop}>
          <div className={styles.walletCardInfo}>
            <div className={styles.walletCardIconWrap}>
              <WalletIcon type={w.type} size={18} />
            </div>
            <div>
              <div className={styles.walletCardName}>{w.name}</div>
              <div className={styles.walletCardType}>
                {walletTypeLabel(w.type)}
                {w.note ? ` · ···${w.note}` : ''}
              </div>
            </div>
          </div>
          <div className={styles.walletCardActions}>
            <button
              className={styles.walletActionBtn}
              onClick={onEdit}
              aria-label="Edit wallet"
            >
              <NavIcon name="edit" size={14} />
            </button>
            <button
              className={styles.walletActionBtn}
              onClick={onDelete}
              aria-label="Delete wallet"
            >
              <NavIcon name="trash" size={14} />
            </button>
          </div>
        </div>
        <div className={styles.walletCardBalance}>{fmtFull(w.balance)}</div>
      </div>
      <div className={styles.walletCardFooter}>
        <div>
          <div className={styles.walletCardFooterLabel}>Pemasukan {monthLabel}</div>
          <div className={styles.walletCardFooterIncome}>+{fmt(income)}</div>
        </div>
        <div>
          <div className={styles.walletCardFooterLabel}>Pengeluaran {monthLabel}</div>
          <div className={styles.walletCardFooterExpense}>-{fmt(expense)}</div>
        </div>
      </div>
    </div>
  );
}
