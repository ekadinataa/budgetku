import { useState, useMemo } from 'react';
import NavIcon from '../../components/icons/NavIcon';
import ProgressBar from '../../components/ui/ProgressBar';
import Select from '../../components/ui/Select';
import IncomeModal from './IncomeModal';
import SectionEditModal from './SectionEditModal';
import PeriodModal from './PeriodModal';
import { sectionLabel, sectionColor, getPeriodRange, filterByRange } from '../../utils/helpers';
import { fmtFull, fmt, monthKey } from '../../utils/formatters';
import { TODAY } from '../../data/defaults';
import styles from './BudgetPage.module.css';

const EMPTY_SECTION = { total: 0, cats: [] };
const EMPTY_BUDGET = {
  totalIncome: 0,
  sections: { needs: EMPTY_SECTION, wants: EMPTY_SECTION, savings: EMPTY_SECTION },
};

/**
 * BudgetPage — Monthly income allocation using the 50/30/20 rule.
 *
 * Now supports period selection: "Per Bulan" (standard calendar month)
 * or "Custom Siklus" (billing cycle based on salary date, e.g. 23–22).
 */
export default function BudgetPage({
  budgets,
  setBudgets,
  transactions,
  categories,
  setCategories,
  cycleStart,
  setCycleStart,
  onCreateCategory,
  onUpdateCategory,
}) {
  const getCat = (id) => categories.find((c) => c.id === id);
  const currentMk = monthKey(new Date(TODAY));

  // Period mode: 'month' or 'cycle'
  const [periodMode, setPeriodMode] = useState(cycleStart > 1 ? 'cycle' : 'month');
  const [selectedMk, setSelectedMk] = useState(currentMk);
  const [editSection, setEditSection] = useState(null);
  const [showIncome, setShowIncome] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  // Build available month options from budgets + transactions
  const monthOptions = useMemo(() => {
    const monthSet = new Set([currentMk]);
    Object.keys(budgets).forEach((k) => monthSet.add(k));
    transactions.forEach((t) => { if (t.date) monthSet.add(t.date.slice(0, 7)); });
    return [...monthSet].sort().reverse().map((mk) => {
      const [y, m] = mk.split('-').map(Number);
      const label = new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      return { value: mk, label };
    });
  }, [budgets, transactions, currentMk]);

  // Compute the active date range based on period mode
  const periodRange = useMemo(() => {
    if (periodMode === 'cycle' && cycleStart > 1) {
      return getPeriodRange(selectedMk, cycleStart);
    }
    // Standard month
    const [y, m] = selectedMk.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const label = new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    return {
      start: `${selectedMk}-01`,
      end: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
      label,
    };
  }, [selectedMk, periodMode, cycleStart]);

  const budget = budgets[selectedMk] || EMPTY_BUDGET;

  // Compute totals
  const totalAllocated = Object.values(budget.sections).reduce((s, sec) => s + sec.total, 0);
  const unallocated = budget.totalIncome - totalAllocated;

  // Filter transactions by the active period range
  const periodTxs = useMemo(
    () => filterByRange(transactions, periodRange).filter((t) => t.type === 'expense'),
    [transactions, periodRange],
  );

  const catSpend = {};
  periodTxs.forEach((t) => {
    catSpend[t.categoryId] = (catSpend[t.categoryId] || 0) + t.amount;
  });
  const secSpend = { needs: 0, wants: 0, savings: 0 };
  periodTxs.forEach((t) => {
    const cat = getCat(t.categoryId);
    if (cat && secSpend[cat.section] !== undefined) {
      secSpend[cat.section] += t.amount;
    }
  });
  const totalSpent = Object.values(secSpend).reduce((s, v) => s + v, 0);

  const handleSaveIncome = (income) => {
    setBudgets((b) => ({
      ...b,
      [selectedMk]: { ...budget, totalIncome: parseFloat(income) || 0 },
    }));
    setShowIncome(false);
  };

  const handleSaveSection = (section, data) => {
    setBudgets((b) => ({
      ...b,
      [selectedMk]: {
        ...budget,
        sections: { ...budget.sections, [section]: data },
      },
    }));
    setEditSection(null);
  };

  const handleSavePeriod = (mode, cs) => {
    setPeriodMode(mode);
    if (mode === 'cycle') {
      setCycleStart(cs);
    } else {
      setCycleStart(1);
    }
    setShowPeriodModal(false);
  };

  // Period display label
  const periodLabel = periodMode === 'cycle' && cycleStart > 1
    ? `Siklus tgl ${cycleStart}: ${periodRange.label}`
    : periodRange.label;

  return (
    <div>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Budget</h1>
          <p className={styles.pageSubtitle}>
            Kelola alokasi anggaran Anda
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnGhost} onClick={() => setShowPeriodModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            {periodMode === 'cycle' && cycleStart > 1 ? `Siklus tgl ${cycleStart}` : 'Per Bulan'}
          </button>
          <Select
            value={selectedMk}
            onChange={(e) => setSelectedMk(e.target.value)}
            style={{ width: 'auto' }}
          >
            {monthOptions.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
          <button className={styles.btnGhost} onClick={() => setShowIncome(true)}>
            <NavIcon name="edit" size={15} /> Atur Pemasukan
          </button>
        </div>
      </div>

      {/* Period info bar */}
      <div className={styles.periodBar}>
        <span className={styles.periodBarLabel}>Periode aktif:</span>
        <span className={styles.periodBarValue}>{periodLabel}</span>
        <span className={styles.periodBarRange}>
          ({periodRange.start} s/d {periodRange.end})
        </span>
      </div>

      {/* Overview Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Pemasukan</div>
          <div className={styles.statValue} style={{ color: '#4F6EF7' }}>
            {fmtFull(budget.totalIncome)}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Dialokasikan</div>
          <div className={styles.statValue} style={{ color: '#F59E0B' }}>
            {fmtFull(totalAllocated)}
          </div>
          <div className={styles.statSub}>
            {budget.totalIncome > 0 ? Math.round((totalAllocated / budget.totalIncome) * 100) : 0}% dari pemasukan
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Belum Dialokasikan</div>
          <div className={styles.statValue} style={{ color: unallocated < 0 ? '#EF4444' : '#22C55E' }}>
            {fmtFull(unallocated)}
          </div>
          <div className={styles.statSub}>
            {unallocated < 0 ? '⚠ Alokasi melebihi pemasukan' : 'Masih tersedia'}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Terpakai</div>
          <div className={styles.statValue} style={{ color: '#EF4444' }}>
            {fmtFull(totalSpent)}
          </div>
          <div className={styles.statSub}>
            {totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0}% dari alokasi
          </div>
        </div>
      </div>

      {/* Distribution Visualization Bar */}
      <div className={styles.distCard}>
        <div className={styles.distHeader}>
          <span className={styles.distTitle}>Distribusi Alokasi</span>
          <span className={styles.distGuide}>Panduan 50/30/20</span>
        </div>
        <div className={styles.distBar}>
          {['needs', 'wants', 'savings'].map((sec) => {
            const pct = budget.totalIncome > 0
              ? ((budget.sections[sec]?.total || 0) / budget.totalIncome) * 100
              : 0;
            return (
              <div key={sec} className={styles.distSegment} style={{ width: `${pct}%`, background: sectionColor(sec) }} />
            );
          })}
          {unallocated > 0 && <div className={styles.distUnalloc} />}
        </div>
        <div className={styles.distLegend}>
          {['needs', 'wants', 'savings'].map((sec) => {
            const pct = budget.totalIncome > 0
              ? Math.round(((budget.sections[sec]?.total || 0) / budget.totalIncome) * 100)
              : 0;
            const guide = sec === 'needs' ? 50 : sec === 'wants' ? 30 : 20;
            return (
              <div key={sec} className={styles.distLegendItem}>
                <div className={styles.distDot} style={{ background: sectionColor(sec) }} />
                <span className={styles.distLegendLabel}>{sectionLabel(sec)}</span>
                <span className={styles.distLegendPct} style={{ color: Math.abs(pct - guide) > 10 ? '#F59E0B' : 'var(--text-1)' }}>
                  {pct}%
                </span>
                <span className={styles.distLegendGuide}>(panduan {guide}%)</span>
              </div>
            );
          })}
          {unallocated > 0 && (
            <div className={styles.distLegendItem}>
              <div className={styles.distDot} style={{ background: 'var(--border)' }} />
              <span className={styles.distLegendLabel} style={{ color: 'var(--text-5)' }}>Belum dialokasikan</span>
              <span className={styles.distLegendPct} style={{ color: 'var(--text-5)' }}>
                {budget.totalIncome > 0 ? Math.round((unallocated / budget.totalIncome) * 100) : 0}%
              </span>
              <span className={styles.distLegendGuide}>({fmtFull(unallocated)})</span>
            </div>
          )}
        </div>
      </div>

      {/* Per-Section Budget Cards */}
      {['needs', 'wants', 'savings'].map((sec) => {
        const secData = budget.sections[sec] || EMPTY_SECTION;
        const spent = secSpend[sec] || 0;
        const over = spent > secData.total;
        const allocatedInSec = secData.cats.reduce((s, c) => s + c.amt, 0);
        const unallocInSec = secData.total - allocatedInSec;

        return (
          <div key={sec} className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderLeft}>
                <div className={styles.sectionDot} style={{ background: sectionColor(sec) }} />
                <span className={styles.sectionName}>{sectionLabel(sec)}</span>
                {over && (
                  <span className={styles.sectionOverflowBadge}>
                    <NavIcon name="warning" size={11} /> Melebihi Batas
                  </span>
                )}
              </div>
              <div className={styles.sectionHeaderRight}>
                <div className={styles.sectionAmounts}>
                  <div className={styles.sectionSpent} style={{ color: over ? '#EF4444' : 'var(--text-1)' }}>
                    {fmtFull(spent)} <span className={styles.sectionSep}>/</span> {fmtFull(secData.total)}
                  </div>
                  <div className={styles.sectionRemaining}>
                    Sisa {fmtFull(Math.max(0, secData.total - spent))}
                  </div>
                </div>
                <button className={styles.sectionEditBtn} onClick={() => setEditSection(sec)}>
                  <NavIcon name="edit" size={13} /> Edit
                </button>
              </div>
            </div>

            <ProgressBar value={spent} max={secData.total} color={sectionColor(sec)} height={8} showOverflow />

            <div className={styles.catGrid}>
              {secData.cats.map((c) => {
                const cat = getCat(c.id);
                const cSpent = catSpend[c.id] || 0;
                const cOver = cSpent > c.amt;
                const cPct = c.amt > 0 ? Math.min((cSpent / c.amt) * 100, 100) : 0;
                return (
                  <div key={c.id} className={styles.catCard}>
                    <div className={styles.catCardHeader}>
                      <div className={styles.catCardLeft}>
                        <div className={styles.catDot} style={{ background: cat?.color || 'var(--text-6)' }} />
                        <span className={styles.catName}>{cat?.name || c.id}</span>
                      </div>
                      {cOver && <span className={styles.catOver}>OVER</span>}
                    </div>
                    <ProgressBar value={cSpent} max={c.amt} color={cat?.color || sectionColor(sec)} height={5} showOverflow />
                    <div className={styles.catFooter}>
                      <span className={styles.catAmounts}>{fmt(cSpent)} / {fmt(c.amt)}</span>
                      <span className={styles.catPct} style={{ color: cOver ? '#EF4444' : 'var(--text-4)' }}>
                        {Math.round(cPct)}%
                      </span>
                    </div>
                  </div>
                );
              })}
              {unallocInSec > 0 && (
                <div className={styles.unallocCard}>
                  <div className={styles.unallocLabel}>Belum Dialokasikan</div>
                  <div className={styles.unallocValue}>{fmtFull(unallocInSec)}</div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Modals */}
      {showIncome && (
        <IncomeModal
          current={budget.totalIncome}
          onClose={() => setShowIncome(false)}
          onSave={handleSaveIncome}
        />
      )}
      {editSection && (
        <SectionEditModal
          section={editSection}
          data={budget.sections[editSection]}
          onClose={() => setEditSection(null)}
          onSave={(data) => handleSaveSection(editSection, data)}
          categories={categories}
          setCategories={setCategories}
          onCreateCategory={onCreateCategory}
          onUpdateCategory={onUpdateCategory}
        />
      )}
      {showPeriodModal && (
        <PeriodModal
          currentMode={periodMode}
          currentCycleStart={cycleStart}
          onClose={() => setShowPeriodModal(false)}
          onSave={handleSavePeriod}
        />
      )}
    </div>
  );
}
