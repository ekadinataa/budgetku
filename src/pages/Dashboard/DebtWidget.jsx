import { fmtFull } from '../../utils/formatters';
import { getUpcomingDebts, getOverdueDebts, getDaysUntilDue } from '../../utils/debtHelpers';
import styles from './Dashboard.module.css';

const TODAY = new Date().toISOString().slice(0, 10);

/**
 * DebtWidget — Dashboard widget showing upcoming and overdue debts.
 *
 * @param {Object} props
 * @param {Array} props.debts - All debt records
 * @param {(page: string) => void} props.setPage - Navigation callback
 */
export default function DebtWidget({ debts = [], setPage }) {
  const upcoming = getUpcomingDebts(debts, TODAY, 7);
  const overdue = getOverdueDebts(debts, TODAY);

  // Don't render if nothing to show
  if (upcoming.length === 0 && overdue.length === 0) return null;

  const allItems = [...overdue, ...upcoming].slice(0, 5);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>💰 Utang/Piutang ({allItems.length})</h3>
        <button className={styles.linkBtn} onClick={() => setPage('debt')}>
          Lihat Semua
        </button>
      </div>
      {allItems.map((debt) => {
        const days = getDaysUntilDue(debt.dueDate, TODAY);
        const isOverdue = days < 0;
        return (
          <div
            key={debt.id}
            className={styles.recentRow}
            style={{ cursor: 'pointer' }}
            onClick={() => setPage('debt')}
          >
            <div
              className={styles.recentIcon}
              style={{
                background: debt.type === 'utang' ? '#FEE2E218' : '#DBEAFE18',
                color: debt.type === 'utang' ? '#DC2626' : '#2563EB',
              }}
            >
              {debt.type === 'utang' ? '↓' : '↑'}
            </div>
            <div className={styles.recentInfo}>
              <div className={styles.recentNote}>{debt.personName}</div>
              <div className={styles.recentMeta}>
                {debt.type === 'utang' ? 'Utang' : 'Piutang'} · {fmtFull(debt.remainingAmount)}
              </div>
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: 6,
              background: isOverdue ? '#FEE2E2' : '#FEF3C7',
              color: isOverdue ? '#DC2626' : '#D97706',
            }}>
              {isOverdue ? `Terlambat ${Math.abs(days)} hari` : `${days} hari lagi`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
