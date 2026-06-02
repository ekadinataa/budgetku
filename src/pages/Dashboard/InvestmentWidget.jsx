import { fmtFull } from '../../utils/formatters';
import { computePortfolioSummary } from '../../utils/investmentHelpers';
import styles from './Dashboard.module.css';

/**
 * InvestmentWidget — Dashboard widget showing portfolio summary.
 *
 * @param {Object} props
 * @param {Array} props.investments - All investment records
 * @param {() => void} props.onNavigate - Navigate to investment page
 */
export default function InvestmentWidget({ investments = [], onNavigate }) {
  // Don't render if no investments
  if (!investments || investments.length === 0) return null;

  const summary = computePortfolioSummary(investments);

  return (
    <div className={styles.card} style={{ cursor: 'pointer' }} onClick={onNavigate}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>📈 Investasi</h3>
        <button className={styles.linkBtn} onClick={(e) => { e.stopPropagation(); onNavigate(); }}>
          Lihat Detail
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Portofolio
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginTop: 4 }}>
            {fmtFull(summary.totalValue)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: summary.totalUnrealizedGain >= 0 ? '#22C55E' : '#EF4444',
          }}>
            {summary.totalUnrealizedGain >= 0 ? '+' : ''}{fmtFull(summary.totalUnrealizedGain)}
          </div>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: summary.totalReturnPercentage >= 0 ? '#22C55E' : '#EF4444',
            marginTop: 2,
          }}>
            {summary.totalReturnPercentage >= 0 ? '+' : ''}{summary.totalReturnPercentage.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
