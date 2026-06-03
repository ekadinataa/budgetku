import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { fmtFull, fmt } from '../../utils/formatters';
import {
  calcFireNumber,
  calcInflationAdjustedFireNumber,
  calcFiReadinessScore,
  generateProjection,
  calcRetirementSustainability,
  generateRecommendations,
  DEFAULT_FIRE_SETTINGS,
} from '../../utils/fireCalculator';
import ProgressBar from '../../components/ui/ProgressBar';
import NavIcon from '../../components/icons/NavIcon';
import styles from './FirePage.module.css';

/**
 * FirePage — FIRE Calculator page.
 *
 * Single scrollable page with card-based sections for FIRE planning.
 * All calculations are client-side only; does not modify transactions or wallets.
 *
 * @param {Object} props
 * @param {Array} props.transactions - User transactions for auto-fill
 * @param {Array} props.investments - User investments for auto-fill
 * @param {(page: string) => void} props.setPage - Navigation callback
 * @param {(settings: Object) => void} props.onSaveFireSettings - Save callback
 * @param {Object} props.fireSettings - Saved FIRE settings
 */
export default function FirePage({
  transactions = [],
  investments = [],
  setPage,
  onSaveFireSettings,
  fireSettings: savedSettings,
}) {
  // Initialize settings from saved or defaults
  const initial = savedSettings && Object.keys(savedSettings).length > 0
    ? { ...DEFAULT_FIRE_SETTINGS, ...savedSettings }
    : DEFAULT_FIRE_SETTINGS;

  const [currentAge, setCurrentAge] = useState(initial.currentAge);
  const [retirementAge, setRetirementAge] = useState(initial.retirementAge);
  const [monthlyIncome, setMonthlyIncome] = useState(initial.monthlyIncome);
  const [monthlyExpenses, setMonthlyExpenses] = useState(initial.monthlyExpenses);
  const [currentAssets, setCurrentAssets] = useState(initial.currentAssets);
  const [allocation, setAllocation] = useState(initial.allocation);
  const [returnRate, setReturnRate] = useState(initial.returnRate);
  const [salaryGrowth, setSalaryGrowth] = useState(initial.salaryGrowth);
  const [inflation, setInflation] = useState(initial.inflation);
  const [postRetirementReturn, setPostRetirementReturn] = useState(initial.postRetirementReturn);
  const [activeTab, setActiveTab] = useState('saran');

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSaveFireSettings) {
        onSaveFireSettings({
          currentAge, retirementAge, monthlyIncome, monthlyExpenses,
          currentAssets, allocation, returnRate, salaryGrowth, inflation, postRetirementReturn,
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [currentAge, retirementAge, monthlyIncome, monthlyExpenses, currentAssets, allocation, returnRate, salaryGrowth, inflation, postRetirementReturn, onSaveFireSettings]);

  // Validations
  const validations = useMemo(() => {
    const errors = {};
    if (currentAge < 15 || currentAge > 80) errors.currentAge = 'Usia harus 15-80 tahun';
    if (retirementAge <= currentAge) errors.retirementAge = 'Target harus lebih dari usia saat ini';
    if (monthlyIncome <= 0) errors.monthlyIncome = 'Pendapatan harus lebih dari 0';
    if (monthlyExpenses < 0) errors.monthlyExpenses = 'Pengeluaran tidak boleh negatif';
    if (monthlyExpenses >= monthlyIncome && monthlyIncome > 0 && monthlyExpenses > 0) {
      errors.expenseWarning = 'Pengeluaran ≥ pendapatan, tidak ada margin tabungan';
    }
    return errors;
  }, [currentAge, retirementAge, monthlyIncome, monthlyExpenses]);

  // Core calculations
  const yearsToRetirement = Math.max(0, retirementAge - currentAge);
  const baseFireNumber = useMemo(() => calcFireNumber(monthlyExpenses), [monthlyExpenses]);
  const inflationAdjustedFire = useMemo(
    () => calcInflationAdjustedFireNumber(baseFireNumber, inflation, yearsToRetirement),
    [baseFireNumber, inflation, yearsToRetirement]
  );
  const fiScore = useMemo(
    () => calcFiReadinessScore(currentAssets, inflationAdjustedFire),
    [currentAssets, inflationAdjustedFire]
  );

  // Score color
  const scoreColor = fiScore < 25 ? '#EF4444' : fiScore < 50 ? '#F59E0B' : fiScore < 75 ? '#EAB308' : '#22C55E';

  // Projection chart data
  const projectionData = useMemo(
    () => generateProjection({
      currentAge, retirementAge, currentAssets, monthlyIncome,
      fireAllocationPct: allocation.fire,
      returnRate, salaryGrowthRate: salaryGrowth, inflationRate: inflation,
      monthlyExpenses,
    }),
    [currentAge, retirementAge, currentAssets, monthlyIncome, allocation.fire, returnRate, salaryGrowth, inflation, monthlyExpenses]
  );

  // Retirement sustainability
  const retirementData = useMemo(() => {
    if (projectionData.length === 0) return { years: 0, data: [] };
    const portfolioAtRetirement = projectionData[projectionData.length - 1]?.moderat || 0;
    const annualExpensesAtRetirement = monthlyExpenses * 12 * Math.pow(1 + inflation / 100, yearsToRetirement);
    return calcRetirementSustainability(portfolioAtRetirement, annualExpensesAtRetirement, postRetirementReturn, inflation, retirementAge);
  }, [projectionData, monthlyExpenses, inflation, yearsToRetirement, postRetirementReturn, retirementAge]);

  // Recommendations
  const recommendations = useMemo(
    () => generateRecommendations({
      savingsRate: allocation.fire,
      readinessScore: fiScore,
      yearsToRetirement,
      monthlyExpenses,
      monthlyIncome,
      currentAssets,
      fireNumber: inflationAdjustedFire,
    }),
    [allocation.fire, fiScore, yearsToRetirement, monthlyExpenses, monthlyIncome, currentAssets, inflationAdjustedFire]
  );

  // Allocation total
  const allocTotal = Object.values(allocation).reduce((s, v) => s + (Number(v) || 0), 0);

  // Auto-fill helpers
  const calcAvgIncome = useCallback(() => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const dateStr = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
    const recentIncome = transactions.filter(t => t.type === 'income' && t.date >= dateStr);
    if (recentIncome.length === 0) return null;
    const total = recentIncome.reduce((s, t) => s + t.amount, 0);
    return Math.round(total / 3);
  }, [transactions]);

  const calcAvgExpense = useCallback(() => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const dateStr = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
    const recentExpenses = transactions.filter(t => t.type === 'expense' && t.date >= dateStr);
    if (recentExpenses.length === 0) return null;
    const total = recentExpenses.reduce((s, t) => s + t.amount, 0);
    return Math.round(total / 3);
  }, [transactions]);

  const calcTotalInvestments = useCallback(() => {
    if (investments.length === 0) return null;
    return investments.reduce((s, inv) => s + (inv.currentValue || 0), 0);
  }, [investments]);

  // Allocation handler
  const handleAllocChange = (key, value) => {
    const num = value === '' ? 0 : Math.max(0, Math.min(100, Number(value)));
    setAllocation(prev => ({ ...prev, [key]: num }));
  };

  // Chart tooltip formatter
  const chartTooltipFormatter = (value) => fmtFull(value);

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => setPage('dashboard')} aria-label="Kembali">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className={styles.pageTitle}>Kalkulator FIRE 🔥</h1>
      </div>

      {/* FI Readiness Score */}
      <div className={`${styles.card} ${styles.scoreCard}`}>
        <div className={styles.scoreValue} style={{ color: scoreColor }}>
          {fiScore.toFixed(1)}%
        </div>
        <div className={styles.scoreLabel}>FI Readiness Score</div>
        <ProgressBar value={fiScore} max={100} color={scoreColor} height={10} />
        {fiScore >= 100 && (
          <div className={styles.congratsMsg}>
            🎉 Selamat! Anda telah mencapai Financial Independence!
          </div>
        )}
      </div>

      {/* FIRE Number Cards */}
      <div className={styles.projCardsRow}>
        <div className={styles.projCard}>
          <div className={styles.projCardLabel}>FIRE Number (Saat Ini)</div>
          <div className={styles.projCardValue}>{fmtFull(baseFireNumber)}</div>
        </div>
        <div className={styles.projCard}>
          <div className={styles.projCardLabel}>FIRE Number (Pensiun)</div>
          <div className={styles.projCardValue}>{fmtFull(Math.round(inflationAdjustedFire))}</div>
        </div>
      </div>

      {/* Data Finansial */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Data Finansial</h3>
        <div className={styles.inputGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Usia Saat Ini</label>
            <input
              type="number"
              className={styles.inputField}
              value={currentAge}
              onChange={e => setCurrentAge(Number(e.target.value) || 0)}
              min={15}
              max={80}
            />
            {validations.currentAge && <span className={styles.validationError}>{validations.currentAge}</span>}
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Target Usia Pensiun</label>
            <input
              type="number"
              className={styles.inputField}
              value={retirementAge}
              onChange={e => setRetirementAge(Number(e.target.value) || 0)}
            />
            {validations.retirementAge && <span className={styles.validationError}>{validations.retirementAge}</span>}
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Pendapatan Bulanan</label>
            <div className={styles.inputWithBtn}>
              <input
                type="number"
                className={styles.inputField}
                value={monthlyIncome}
                onChange={e => setMonthlyIncome(Number(e.target.value) || 0)}
              />
              {transactions.length > 0 && (
                <button
                  className={styles.autoFillBtn}
                  onClick={() => { const v = calcAvgIncome(); if (v) setMonthlyIncome(v); }}
                  title="Auto-fill dari data transaksi"
                >
                  Auto
                </button>
              )}
            </div>
            {validations.monthlyIncome && <span className={styles.validationError}>{validations.monthlyIncome}</span>}
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Pengeluaran Bulanan</label>
            <div className={styles.inputWithBtn}>
              <input
                type="number"
                className={styles.inputField}
                value={monthlyExpenses}
                onChange={e => setMonthlyExpenses(Number(e.target.value) || 0)}
              />
              {transactions.length > 0 && (
                <button
                  className={styles.autoFillBtn}
                  onClick={() => { const v = calcAvgExpense(); if (v) setMonthlyExpenses(v); }}
                  title="Auto-fill dari data transaksi"
                >
                  Auto
                </button>
              )}
            </div>
            {validations.monthlyExpenses && <span className={styles.validationError}>{validations.monthlyExpenses}</span>}
            {validations.expenseWarning && <span className={styles.validationWarning}>{validations.expenseWarning}</span>}
          </div>
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.inputLabel}>Aset FIRE Saat Ini</label>
            <div className={styles.inputWithBtn}>
              <input
                type="number"
                className={styles.inputField}
                value={currentAssets}
                onChange={e => setCurrentAssets(Number(e.target.value) || 0)}
              />
              {investments.length > 0 && (
                <button
                  className={styles.autoFillBtn}
                  onClick={() => { const v = calcTotalInvestments(); if (v !== null) setCurrentAssets(v); }}
                  title="Auto-fill dari portofolio investasi"
                >
                  Auto
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alokasi Pendapatan */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Alokasi Pendapatan</h3>
        {[
          { key: 'pokok', label: 'Pokok' },
          { key: 'hiburan', label: 'Hiburan' },
          { key: 'fire', label: 'FIRE' },
          { key: 'emas', label: 'Emas' },
        ].map(({ key, label }) => (
          <div key={key} className={styles.allocRow}>
            <span className={styles.allocLabel}>{label}</span>
            <input
              type="number"
              className={styles.allocInput}
              value={allocation[key]}
              onChange={e => handleAllocChange(key, e.target.value)}
              min={0}
              max={100}
            />
            <span className={styles.allocPct}>%</span>
            <span className={styles.allocNominal}>
              {fmt(Math.round(monthlyIncome * (allocation[key] || 0) / 100))}
            </span>
          </div>
        ))}
        <div className={styles.allocTotal}>
          <span className={styles.allocTotalLabel}>Total</span>
          <span className={styles.allocTotalValue} style={{ color: allocTotal === 100 ? '#22C55E' : allocTotal > 100 ? '#EF4444' : '#F59E0B' }}>
            {allocTotal}%
          </span>
        </div>
        {allocTotal > 100 && <span className={styles.validationError}>Total melebihi 100% ({allocTotal - 100}% lebih)</span>}
        {allocTotal < 100 && <span className={styles.validationWarning}>Sisa {100 - allocTotal}% belum dialokasikan</span>}
      </div>

      {/* Asumsi Pasar */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Asumsi Pasar</h3>
        <div className={styles.sliderRow}>
          <div className={styles.sliderHeader}>
            <span className={styles.sliderLabel}>Return Investasi Pra-Pensiun</span>
            <span className={styles.sliderValue}>{returnRate}%</span>
          </div>
          <input type="range" className={styles.slider} min={1} max={20} step={0.5} value={returnRate} onChange={e => setReturnRate(Number(e.target.value))} />
          <div className={styles.sliderRange}><span>1%</span><span>20%</span></div>
        </div>
        <div className={styles.sliderRow}>
          <div className={styles.sliderHeader}>
            <span className={styles.sliderLabel}>Kenaikan Gaji Tahunan</span>
            <span className={styles.sliderValue}>{salaryGrowth}%</span>
          </div>
          <input type="range" className={styles.slider} min={0} max={15} step={0.5} value={salaryGrowth} onChange={e => setSalaryGrowth(Number(e.target.value))} />
          <div className={styles.sliderRange}><span>0%</span><span>15%</span></div>
        </div>
        <div className={styles.sliderRow}>
          <div className={styles.sliderHeader}>
            <span className={styles.sliderLabel}>Estimasi Inflasi</span>
            <span className={styles.sliderValue}>{inflation}%</span>
          </div>
          <input type="range" className={styles.slider} min={1} max={12} step={0.5} value={inflation} onChange={e => setInflation(Number(e.target.value))} />
          <div className={styles.sliderRange}><span>1%</span><span>12%</span></div>
        </div>
        <div className={styles.sliderRow}>
          <div className={styles.sliderHeader}>
            <span className={styles.sliderLabel}>Return Konservatif Pasca-Pensiun</span>
            <span className={styles.sliderValue}>{postRetirementReturn}%</span>
          </div>
          <input type="range" className={styles.slider} min={1} max={12} step={0.5} value={postRetirementReturn} onChange={e => setPostRetirementReturn(Number(e.target.value))} />
          <div className={styles.sliderRange}><span>1%</span><span>12%</span></div>
        </div>
      </div>

      {/* Proyeksi Pertumbuhan Chart */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Proyeksi Pertumbuhan Portofolio</h3>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projectionData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: 'Usia', position: 'bottom', fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} width={50} />
              <Tooltip formatter={chartTooltipFormatter} labelFormatter={l => `Usia ${l}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={inflationAdjustedFire} stroke="#DC2626" strokeDasharray="5 5" label={{ value: 'Target', fontSize: 10, fill: '#DC2626' }} />
              <Line type="monotone" dataKey="optimis" name="Optimis" stroke="#22C55E" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="moderat" name="Moderat" stroke="#4F6EF7" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="pesimis" name="Pesimis" stroke="#F59E0B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Results Tabs */}
      <div className={styles.card}>
        <div className={styles.tabs}>
          <button className={`${styles.tabBtn} ${activeTab === 'saran' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('saran')}>Saran</button>
          <button className={`${styles.tabBtn} ${activeTab === 'akumulasi' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('akumulasi')}>Akumulasi</button>
          <button className={`${styles.tabBtn} ${activeTab === 'pensiun' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('pensiun')}>Pensiun</button>
        </div>

        {activeTab === 'saran' && (
          <div className={styles.recList}>
            {recommendations.map((rec, i) => (
              <div key={i} className={`${styles.recItem} ${rec.type === 'warning' ? styles.recItemWarning : rec.type === 'success' ? styles.recItemSuccess : styles.recItemInfo}`}>
                <span className={styles.recIcon}>
                  {rec.type === 'warning' ? '⚠️' : rec.type === 'success' ? '✅' : 'ℹ️'}
                </span>
                <span>{rec.text}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'akumulasi' && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tahun</th>
                  <th>Usia</th>
                  <th>Tabungan/Thn</th>
                  <th>Portofolio</th>
                  <th>Growth</th>
                </tr>
              </thead>
              <tbody>
                {projectionData.map((row, i) => {
                  const annualSavings = monthlyIncome * 12 * (allocation.fire / 100) * Math.pow(1 + salaryGrowth / 100, i);
                  const growth = i === 0 ? 0 : ((row.moderat - projectionData[0].moderat) / Math.max(1, projectionData[0].moderat) * 100);
                  return (
                    <tr key={row.year}>
                      <td>{row.year}</td>
                      <td>{row.age}</td>
                      <td>{fmt(Math.round(annualSavings))}</td>
                      <td>{fmt(row.moderat)}</td>
                      <td style={{ color: growth >= 0 ? '#22C55E' : '#EF4444' }}>
                        {i === 0 ? '—' : `${growth.toFixed(0)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'pensiun' && (
          <>
            <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-3)' }}>
              Portofolio cukup untuk <strong style={{ color: 'var(--text-1)' }}>{retirementData.years} tahun</strong> pensiun
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tahun</th>
                    <th>Usia</th>
                    <th>Penarikan</th>
                    <th>Sisa</th>
                    <th>Return</th>
                  </tr>
                </thead>
                <tbody>
                  {retirementData.data.slice(0, 30).map(row => (
                    <tr key={row.year}>
                      <td>{row.year}</td>
                      <td>{row.age}</td>
                      <td>{fmt(row.withdrawal)}</td>
                      <td>{fmt(row.remaining)}</td>
                      <td style={{ color: '#22C55E' }}>{fmt(row.returnAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
