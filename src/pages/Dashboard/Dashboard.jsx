import { fmtFull, fmt, fmtDate, monthKey } from '../../utils/formatters';
import {
  getCatById,
  getWalletById,
  sectionLabel,
  sectionColor,
  walletTypeLabel,
  getRecentTransactions,
} from '../../utils/helpers';
import ProgressBar from '../../components/ui/ProgressBar';
import AmountText from '../../components/ui/AmountText';
import NavIcon from '../../components/icons/NavIcon';
import WalletIcon from '../../components/ui/WalletIcon';
import StatCard from './StatCard';
import Calendar from './Calendar';
import styles from './Dashboard.module.css';

/**
 * Dashboard — Main overview page.
 *
 * Shows daily budget, monthly stats, budget summary, calendar,
 * wallet summary, and recent transactions.
 *
 * @param {Object} props
 * @param {Array} props.wallets
 * @param {Array} props.transactions
 * @param {Object} props.budgets
 * @param {Function} props.setPage
 * @param {Function} props.onAddTx
 * @param {Array} props.categories
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */
export default function Dashboard({
  wallets,
  transactions,
  budgets,
  setPage,
  onAddTx,
  categories,
}) {
  const today = new Date();
  const mk = monthKey(today);
  const budget = budgets[mk] || {};
  const sections = budget.sections || {};

  // Today's date string
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Today's expense transactions
  const todayTxs = transactions.filter(
    (t) => t.date === todayStr && t.type === 'expense'
  );
  const todaySpent = todayTxs.reduce((s, t) => s + t.amount, 0);

  // Month totals
  const monthTxs = transactions.filter((t) => t.date.startsWith(mk));
  const monthIncome = monthTxs
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTxs
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  // Daily budget
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();
  const dailyBudget = monthIncome / daysInMonth;
  const dailyRemaining = dailyBudget - todaySpent;

  // Section spending
  const sectionSpend = { needs: 0, wants: 0, savings: 0 };
  monthTxs
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = getCatById(t.categoryId, categories);
      if (cat && sectionSpend[cat.section] !== undefined) {
        sectionSpend[cat.section] += t.amount;
      }
    });

  // Month label for stat card
  const monthLabel = today.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  // Expense percentage of income
  const expPct =
    monthIncome > 0 ? Math.round((monthExpense / monthIncome) * 100) : 0;

  // Total balance
  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);

  // Recent transactions (6 most recent non-transfer)
  const recentTxs = getRecentTransactions(transactions, 6);

  return (
    <div className={styles.wrapper}>
      {/* Top stat row */}
      <div className={styles.statGrid}>
        <StatCard
          label="Budget Hari Ini"
          value={fmtFull(dailyBudget)}
          sub={`Terpakai ${fmt(todaySpent)}`}
          accent={dailyRemaining >= 0 ? '#22C55E' : '#EF4444'}
          icon="budget"
          detail={`Sisa ${fmtFull(Math.abs(dailyRemaining))}${dailyRemaining < 0 ? ' (lebih)' : ''}`}
        />
        <StatCard
          label="Pemasukan Bulan Ini"
          value={fmtFull(monthIncome)}
          sub={monthLabel}
          accent="#4F6EF7"
          icon="income"
        />
        <StatCard
          label="Pengeluaran Bulan Ini"
          value={fmtFull(monthExpense)}
          sub={`${expPct}% dari pemasukan`}
          accent="#EF4444"
          icon="expense"
        />
        <StatCard
          label="Total Saldo"
          value={fmtFull(totalBalance)}
          sub={`${wallets.length} dompet aktif`}
          accent="#A855F7"
          icon="wallet"
        />
      </div>

      <div className={styles.mainGrid}>
        {/* Left column */}
        <div className={styles.leftCol}>
          {/* Budget summary */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Ringkasan Budget</h3>
              <button
                className={styles.btnGhost}
                onClick={() => setPage('budget')}
              >
                Lihat Detail
              </button>
            </div>
            {['needs', 'wants', 'savings'].map((sec) => {
              const secData = sections[sec] || { total: 0, cats: [] };
              const spent = sectionSpend[sec];
              const pct =
                secData.total > 0
                  ? Math.round((spent / secData.total) * 100)
                  : 0;
              const over = spent > secData.total;
              return (
                <div key={sec} className={styles.budgetRow}>
                  <div className={styles.budgetRowHeader}>
                    <div className={styles.budgetRowLeft}>
                      <div
                        className={styles.budgetSectionDot}
                        style={{ background: sectionColor(sec) }}
                      />
                      <span className={styles.budgetSectionName}>
                        {sectionLabel(sec)}
                      </span>
                      {over && (
                        <span className={styles.budgetOverflow}>
                          MELEBIHI!
                        </span>
                      )}
                    </div>
                    <div className={styles.budgetRowRight}>
                      <span
                        className={styles.budgetSpent}
                        style={{
                          color: over ? '#EF4444' : 'var(--text-1)',
                        }}
                      >
                        {fmt(spent)}
                      </span>
                      <span className={styles.budgetSep}> / </span>
                      <span>{fmt(secData.total)}</span>
                    </div>
                  </div>
                  <ProgressBar
                    value={spent}
                    max={secData.total}
                    color={sectionColor(sec)}
                    height={7}
                    showOverflow
                  />
                  <div className={styles.budgetFooter}>
                    {pct}% terpakai · Sisa{' '}
                    {fmt(Math.max(0, secData.total - spent))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar */}
          <Calendar
            transactions={transactions}
            wallets={wallets}
            categories={categories}
            today={today}
          />
        </div>

        {/* Right column */}
        <div className={styles.rightCol}>
          {/* Quick add button */}
          <button className={styles.addTxBtn} onClick={onAddTx}>
            <NavIcon name="plus" size={18} /> Tambah Transaksi
          </button>

          {/* Wallet summary */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Dompet</h3>
              <button
                className={styles.linkBtn}
                onClick={() => setPage('wallet')}
              >
                Lihat Semua
              </button>
            </div>
            {wallets.slice(0, 4).map((w) => (
              <div key={w.id} className={styles.walletRow}>
                <div
                  className={styles.walletIcon}
                  style={{
                    background: w.color + '18',
                    color: w.color,
                  }}
                >
                  <WalletIcon type={w.type} size={16} />
                </div>
                <div className={styles.walletInfo}>
                  <div className={styles.walletName}>{w.name}</div>
                  <div className={styles.walletType}>
                    {walletTypeLabel(w.type)}
                  </div>
                </div>
                <div
                  className={styles.walletBalance}
                  style={{
                    color:
                      w.balance < 0 ? '#EF4444' : 'var(--text-1)',
                  }}
                >
                  {fmt(w.balance)}
                </div>
              </div>
            ))}
          </div>

          {/* Recent transactions */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Transaksi Terbaru</h3>
              <button
                className={styles.linkBtn}
                onClick={() => setPage('tx')}
              >
                Lihat Semua
              </button>
            </div>
            {recentTxs.map((t) => {
              const cat = getCatById(t.categoryId, categories);
              return (
                <div key={t.id} className={styles.recentRow}>
                  <div
                    className={styles.recentIcon}
                    style={{
                      background:
                        (cat?.color || 'var(--text-6)') + '18',
                      color: cat?.color || 'var(--text-5)',
                    }}
                  >
                    {t.type === 'income' ? '↑' : '↓'}
                  </div>
                  <div className={styles.recentInfo}>
                    <div className={styles.recentNote}>{t.note}</div>
                    <div className={styles.recentMeta}>
                      {fmtDate(t.date)} · {cat?.name || '—'}
                    </div>
                  </div>
                  <AmountText
                    type={t.type}
                    amount={t.amount}
                    size={13}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
