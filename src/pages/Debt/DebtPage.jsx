import { useState, useMemo } from 'react';
import { fmtFull, fmtDate } from '../../utils/formatters';
import {
  computeDebtSummary,
  filterDebts,
  sortDebtsByDate,
  getDaysUntilDue,
  getCurrentInstallmentInfo,
  generateAmortizationSchedule,
} from '../../utils/debtHelpers';
import NavIcon from '../../components/icons/NavIcon';
import DebtFormModal from './DebtFormModal';
import PaymentModal from './PaymentModal';
import styles from './DebtPage.module.css';

const TODAY = new Date().toISOString().slice(0, 10);

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'utang', label: 'Utang' },
  { key: 'piutang', label: 'Piutang' },
  { key: 'active', label: 'Aktif' },
  { key: 'settled', label: 'Lunas' },
];

/**
 * DebtPage — Main debt management page.
 *
 * @param {Object} props
 * @param {Array} props.debts - All debt records
 * @param {Array} props.wallets - All wallets
 * @param {(data: Object) => Promise} props.onCreateDebt
 * @param {(id: string, data: Object) => Promise} props.onUpdateDebt
 * @param {(id: string) => Promise} props.onDeleteDebt
 * @param {(debtId: string, payment: Object) => Promise} props.onRecordPayment
 */
export default function DebtPage({
  debts,
  wallets,
  onCreateDebt,
  onUpdateDebt,
  onDeleteDebt,
  onRecordPayment,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [payItem, setPayItem] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // Summary
  const summary = useMemo(() => computeDebtSummary(debts), [debts]);

  // Filtered and sorted debts
  const filteredDebts = useMemo(() => {
    let filters = {};
    if (activeFilter === 'utang') filters.type = 'utang';
    else if (activeFilter === 'piutang') filters.type = 'piutang';
    else if (activeFilter === 'active') filters.status = 'active';
    else if (activeFilter === 'settled') filters.status = 'settled';
    return sortDebtsByDate(filterDebts(debts, filters));
  }, [debts, activeFilter]);

  // Handlers
  const handleSave = async (data) => {
    if (editItem) {
      await onUpdateDebt(editItem.id, data);
    } else {
      await onCreateDebt(data);
    }
    setShowForm(false);
    setEditItem(null);
  };

  const handleDelete = async (id) => {
    await onDeleteDebt(id);
    setShowForm(false);
    setEditItem(null);
  };

  const handlePayment = async (paymentData) => {
    await onRecordPayment(payItem.id, paymentData);
    setPayItem(null);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setShowForm(true);
  };

  return (
    <div>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Utang/Piutang</h1>
          <p className={styles.pageSubtitle}>
            Kelola catatan utang dan piutang Anda
          </p>
        </div>
        <button className={styles.addBtn} onClick={() => { setEditItem(null); setShowForm(true); }}>
          <NavIcon name="plus" size={16} /> Tambah
        </button>
      </div>

      {/* Summary cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Utang</div>
          <div className={styles.summaryValue} style={{ color: '#DC2626' }}>
            {fmtFull(summary.totalUtang)}
          </div>
          <div className={styles.summarySub}>yang harus dibayar</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Piutang</div>
          <div className={styles.summaryValue} style={{ color: '#2563EB' }}>
            {fmtFull(summary.totalPiutang)}
          </div>
          <div className={styles.summarySub}>yang akan diterima</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Posisi Bersih</div>
          <div className={styles.summaryValue} style={{ color: summary.netPosition >= 0 ? '#22C55E' : '#DC2626' }}>
            {fmtFull(summary.netPosition)}
          </div>
          <div className={styles.summarySub}>piutang − utang</div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`${styles.filterBtn} ${activeFilter === f.key ? styles.filterBtnActive : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {debts.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <div className={styles.emptyTitle}>Belum ada catatan utang/piutang</div>
          <div className={styles.emptyDesc}>
            Catat utang dan piutang Anda di sini. BudgetX akan otomatis membuat transaksi dan memperbarui saldo dompet.
          </div>
          <button className={styles.addBtn} onClick={() => setShowForm(true)} style={{ margin: '0 auto' }}>
            <NavIcon name="plus" size={16} /> Tambah Pertama
          </button>
        </div>
      )}

      {/* Debt list */}
      {filteredDebts.map((debt) => (
        <DebtCard
          key={debt.id}
          debt={debt}
          onEdit={() => handleEdit(debt)}
          onPay={() => setPayItem(debt)}
        />
      ))}

      {/* Form Modal */}
      {showForm && (
        <DebtFormModal
          initial={editItem}
          wallets={wallets}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSave={handleSave}
          onDelete={editItem ? handleDelete : undefined}
        />
      )}

      {/* Payment Modal */}
      {payItem && (
        <PaymentModal
          debt={payItem}
          wallets={wallets}
          onClose={() => setPayItem(null)}
          onConfirm={handlePayment}
        />
      )}
    </div>
  );
}

/**
 * DebtCard — Single debt record display card.
 */
function DebtCard({ debt, onEdit, onPay }) {
  const [showHistory, setShowHistory] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const daysUntilDue = debt.dueDate ? getDaysUntilDue(debt.dueDate, TODAY) : null;
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && debt.status === 'active';
  const progress = debt.totalAmount > 0
    ? ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100
    : 0;

  const iconBg = debt.type === 'utang' ? 'rgba(220, 38, 38, 0.08)' : 'rgba(37, 99, 235, 0.08)';
  const iconColor = debt.type === 'utang' ? '#DC2626' : '#2563EB';

  const installmentInfo = getCurrentInstallmentInfo(debt);
  const isAnnuityDebt = debt.interestEnabled || (debt.interestRate > 0 && debt.tenorMonths > 0);

  return (
    <div className={`${styles.card} ${isOverdue ? styles.cardOverdue : ''}`}>
      <div className={styles.cardRow}>
        <div
          className={styles.cardIcon}
          style={{ background: iconBg, color: iconColor }}
        >
          {debt.type === 'utang' ? '↓' : '↑'}
        </div>

        <div className={styles.cardInfo}>
          <div className={styles.cardName}>{debt.personName}</div>
          <div className={styles.cardMeta}>
            <span className={`${styles.badge} ${debt.type === 'utang' ? styles.badgeUtang : styles.badgePiutang}`}>
              {debt.type === 'utang' ? 'Utang' : 'Piutang'}
            </span>
            {isAnnuityDebt && (
              <span className={`${styles.badge}`} style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#FBBF24' }}>
                {debt.interestRate}% Anuitas
              </span>
            )}
            {debt.status === 'settled' && (
              <span className={`${styles.badge} ${styles.badgeSettled}`}>Lunas</span>
            )}
            {isOverdue && (
              <span className={`${styles.badge} ${styles.badgeOverdue}`}>Terlambat</span>
            )}
            {debt.dueDate && (
              <span>Jatuh tempo: {fmtDate(debt.dueDate)}</span>
            )}
          </div>
          {isAnnuityDebt && debt.status === 'active' && installmentInfo && (
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>
              Cicilan ke-{installmentInfo.month}: {fmtFull(installmentInfo.total)}/bln
              (Pokok {fmtFull(installmentInfo.principal)} + Bunga {fmtFull(installmentInfo.interest)})
            </div>
          )}
        </div>

        <div className={styles.cardRight}>
          <div>
            <div className={styles.cardAmount}>{fmtFull(debt.totalAmount)}</div>
            <div className={styles.cardRemaining}>
              Sisa pokok: {fmtFull(debt.remainingAmount)}
            </div>
          </div>

          <div className={styles.progressWrap}>
            <div
              className={styles.progressBar}
              style={{
                width: `${Math.min(100, progress)}%`,
                background: debt.status === 'settled' ? '#22C55E' : '#4F6EF7',
              }}
            />
          </div>

          {debt.status === 'active' && (
            <button className={styles.payBtn} onClick={onPay}>
              Bayar
            </button>
          )}

          <div className={styles.actions}>
            <button className={styles.actionBtn} onClick={onEdit} title="Edit">
              <NavIcon name="edit" size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Amortization schedule toggle (for interest debts) */}
      {isAnnuityDebt && (() => {
        const schedule = generateAmortizationSchedule(
          debt.totalAmount, debt.interestRate, debt.tenorMonths, debt.startDate || debt.createdAt || ''
        );
        if (schedule.length === 0) return null;
        return (
          <>
            <button
              className={styles.toggleBtn}
              onClick={() => setShowSchedule((v) => !v)}
            >
              {showSchedule ? '▲ Sembunyikan jadwal' : '▼ Tabel amortisasi'} ({schedule.length} bulan)
            </button>
            {showSchedule && (
              <div className={styles.paymentHistory}>
                <div className={styles.paymentHistoryTitle}>Jadwal Amortisasi</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-2)' }}>
                        <th style={{ padding: '4px 6px', textAlign: 'left', color: 'var(--text-4)' }}>Bln</th>
                        <th style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--text-4)' }}>Pokok</th>
                        <th style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--text-4)' }}>Bunga</th>
                        <th style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--text-4)' }}>Total</th>
                        <th style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--text-4)' }}>Sisa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((row, i) => {
                        const isPaid = i < (debt.payments || []).length;
                        return (
                          <tr key={i} style={{
                            borderBottom: '1px solid var(--border-2)',
                            background: isPaid ? 'rgba(34, 197, 94, 0.04)' : 'transparent',
                            color: isPaid ? 'var(--text-4)' : 'var(--text-2)',
                          }}>
                            <td style={{ padding: '4px 6px' }}>
                              {row.month} {isPaid && '✓'}
                            </td>
                            <td style={{ padding: '4px 6px', textAlign: 'right' }}>{fmtFull(row.principal)}</td>
                            <td style={{ padding: '4px 6px', textAlign: 'right', color: '#D97706' }}>{fmtFull(row.interest)}</td>
                            <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 600 }}>{fmtFull(row.total)}</td>
                            <td style={{ padding: '4px 6px', textAlign: 'right' }}>{fmtFull(row.remainingPrincipal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Payment history toggle */}
      {debt.payments && debt.payments.length > 0 && (
        <>
          <button
            className={styles.toggleBtn}
            onClick={() => setShowHistory((v) => !v)}
          >
            {showHistory ? '▲ Sembunyikan' : '▼ Riwayat pembayaran'} ({debt.payments.length})
          </button>
          {showHistory && (
            <div className={styles.paymentHistory}>
              <div className={styles.paymentHistoryTitle}>Riwayat Pembayaran</div>
              {debt.payments.map((p, i) => (
                <div key={i} className={styles.paymentItem}>
                  <span className={styles.paymentItemDate}>{fmtDate(p.date)}</span>
                  <span>{p.note || '—'}</span>
                  <span className={styles.paymentItemAmount}>
                    {fmtFull(p.amount)}
                    {p.interestPart > 0 && (
                      <span style={{ fontSize: 10, color: 'var(--text-4)', display: 'block' }}>
                        Pokok {fmtFull(p.principalPart)} + Bunga {fmtFull(p.interestPart)}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
