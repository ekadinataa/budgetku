import { useState, useMemo } from 'react';
import { fmtFull, fmtDate } from '../../utils/formatters';
import {
  computeInvestmentMetrics,
  computePortfolioSummary,
  filterInvestments,
  sortTransactionsByDate,
  computeTotalUnits,
  getDaysUntilMaturity,
  calcDepositoProjectedReturn,
} from '../../utils/investmentHelpers';
import NavIcon from '../../components/icons/NavIcon';
import InvestmentFormModal from './InvestmentFormModal';
import BuyModal from './BuyModal';
import SellModal from './SellModal';
import UpdateValueModal from './UpdateValueModal';
import styles from './InvestmentPage.module.css';

const TODAY = new Date().toISOString().slice(0, 10);

const ASSET_TYPE_LABELS = {
  deposito: 'Deposito',
  saham: 'Saham',
  crypto: 'Crypto',
  emas: 'Emas',
  reksadana: 'Reksadana',
  obligasi: 'Obligasi',
  p2p: 'P2P Lending',
  lainnya: 'Lainnya',
};

const FILTERS = [
  { key: null, label: 'Semua' },
  { key: 'deposito', label: 'Deposito' },
  { key: 'saham', label: 'Saham' },
  { key: 'crypto', label: 'Crypto' },
  { key: 'emas', label: 'Emas' },
  { key: 'reksadana', label: 'Reksadana' },
  { key: 'obligasi', label: 'Obligasi' },
  { key: 'p2p', label: 'P2P' },
  { key: 'lainnya', label: 'Lainnya' },
];

/**
 * InvestmentPage — Main investment portfolio page.
 */
export default function InvestmentPage({
  investments,
  wallets,
  onCreateInvestment,
  onUpdateInvestment,
  onDeleteInvestment,
  onRecordBuy,
  onRecordSell,
  onUpdateValue,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [buyItem, setBuyItem] = useState(null);
  const [sellItem, setSellItem] = useState(null);
  const [updateItem, setUpdateItem] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);

  // Portfolio summary
  const summary = useMemo(() => computePortfolioSummary(investments), [investments]);

  // Filtered investments
  const filtered = useMemo(
    () => filterInvestments(investments, activeFilter),
    [investments, activeFilter]
  );

  // Handlers
  const handleSave = async (data) => {
    if (editItem) {
      await onUpdateInvestment(editItem.id, data);
    } else {
      await onCreateInvestment(data);
    }
    setShowForm(false);
    setEditItem(null);
  };

  const handleDelete = async (id) => {
    await onDeleteInvestment(id);
    setShowForm(false);
    setEditItem(null);
  };

  const handleBuy = async (txData) => {
    await onRecordBuy(buyItem.id, txData);
    setBuyItem(null);
  };

  const handleSell = async (txData) => {
    await onRecordSell(sellItem.id, txData);
    setSellItem(null);
  };

  const handleUpdateValue = async (value) => {
    await onUpdateValue(updateItem.id, value);
    setUpdateItem(null);
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
          <h1 className={styles.pageTitle}>Investasi</h1>
          <p className={styles.pageSubtitle}>
            Kelola portofolio investasi Anda
          </p>
        </div>
        <button className={styles.addBtn} onClick={() => { setEditItem(null); setShowForm(true); }}>
          <NavIcon name="plus" size={16} /> Tambah
        </button>
      </div>

      {/* Summary cards */}
      {investments.length > 0 && (
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Total Nilai</div>
            <div className={styles.summaryValue}>
              {fmtFull(summary.totalValue)}
            </div>
            <div className={styles.summarySub}>nilai pasar saat ini</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Total Modal</div>
            <div className={styles.summaryValue}>
              {fmtFull(summary.totalCostBasis)}
            </div>
            <div className={styles.summarySub}>total investasi</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Profit/Loss</div>
            <div className={styles.summaryValue} style={{ color: summary.totalUnrealizedGain >= 0 ? '#22C55E' : '#EF4444' }}>
              {summary.totalUnrealizedGain >= 0 ? '+' : ''}{fmtFull(summary.totalUnrealizedGain)}
            </div>
            <div className={styles.summarySub}>unrealized gain/loss</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Return</div>
            <div className={styles.summaryValue} style={{ color: summary.totalReturnPercentage >= 0 ? '#22C55E' : '#EF4444' }}>
              {summary.totalReturnPercentage >= 0 ? '+' : ''}{summary.totalReturnPercentage.toFixed(1)}%
            </div>
            <div className={styles.summarySub}>persentase return</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        {FILTERS.map((f) => (
          <button
            key={f.key || 'all'}
            className={`${styles.filterBtn} ${activeFilter === f.key ? styles.filterBtnActive : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {investments.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📈</div>
          <div className={styles.emptyTitle}>Belum ada investasi</div>
          <div className={styles.emptyDesc}>
            Catat investasi Anda di sini. BudgetX akan otomatis melacak profit/loss dan membuat transaksi di dompet.
          </div>
          <button className={styles.addBtn} onClick={() => setShowForm(true)} style={{ margin: '0 auto' }}>
            <NavIcon name="plus" size={16} /> Tambah Pertama
          </button>
        </div>
      )}

      {/* Investment list */}
      {filtered.map((inv) => (
        <InvestmentCard
          key={inv.id}
          investment={inv}
          onEdit={() => handleEdit(inv)}
          onBuy={() => setBuyItem(inv)}
          onSell={() => setSellItem(inv)}
          onUpdateValue={() => setUpdateItem(inv)}
        />
      ))}

      {/* Modals */}
      {showForm && (
        <InvestmentFormModal
          initial={editItem}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSave={handleSave}
          onDelete={editItem ? handleDelete : undefined}
        />
      )}

      {buyItem && (
        <BuyModal
          investment={buyItem}
          wallets={wallets}
          onClose={() => setBuyItem(null)}
          onConfirm={handleBuy}
        />
      )}

      {sellItem && (
        <SellModal
          investment={sellItem}
          wallets={wallets}
          onClose={() => setSellItem(null)}
          onConfirm={handleSell}
        />
      )}

      {updateItem && (
        <UpdateValueModal
          investment={updateItem}
          onClose={() => setUpdateItem(null)}
          onConfirm={handleUpdateValue}
        />
      )}
    </div>
  );
}

/**
 * InvestmentCard — Single investment record display card.
 */
function InvestmentCard({ investment, onEdit, onBuy, onSell, onUpdateValue }) {
  const [showHistory, setShowHistory] = useState(false);

  const metrics = computeInvestmentMetrics(investment);
  const totalUnits = computeTotalUnits(investment.transactions || []);
  const isDeposito = investment.assetType === 'deposito';

  // Deposito maturity info
  let maturityInfo = null;
  if (isDeposito && investment.maturityDate) {
    const daysLeft = getDaysUntilMaturity(investment.maturityDate, TODAY);
    const buyTx = (investment.transactions || []).find((t) => t.type === 'buy');
    const principal = buyTx?.totalAmount || buyTx?.pricePerUnit || 0;
    const projectedReturn = calcDepositoProjectedReturn(
      principal,
      investment.interestRate || 0,
      buyTx?.date || TODAY,
      investment.maturityDate
    );
    maturityInfo = { daysLeft, projectedReturn, principal };
  }

  const sortedTxs = sortTransactionsByDate(investment.transactions || []);

  return (
    <div className={styles.card}>
      <div className={styles.cardRow}>
        <div
          className={styles.cardIcon}
          style={{ background: '#4F6EF718', color: '#4F6EF7' }}
        >
          📊
        </div>

        <div className={styles.cardInfo}>
          <div className={styles.cardName}>{investment.name}</div>
          <div className={styles.cardMeta}>
            <span className={`${styles.badge} ${styles.badgeType}`}>
              {ASSET_TYPE_LABELS[investment.assetType] || investment.assetType}
            </span>
            {investment.tickerSymbol && <span>{investment.tickerSymbol}</span>}
            {investment.coinName && <span>{investment.coinName}</span>}
            {totalUnits > 0 && !isDeposito && <span>{totalUnits} unit</span>}
            {metrics.unrealizedGain !== 0 && (
              <span className={`${styles.badge} ${metrics.unrealizedGain >= 0 ? styles.badgeGain : styles.badgeLoss}`}>
                {metrics.unrealizedGain >= 0 ? '+' : ''}{metrics.returnPercentage.toFixed(1)}%
              </span>
            )}
            {maturityInfo && maturityInfo.daysLeft <= 0 && (
              <span className={`${styles.badge} ${styles.badgeMatured}`}>Jatuh Tempo</span>
            )}
          </div>
          {isDeposito && maturityInfo && maturityInfo.daysLeft > 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>
              {maturityInfo.daysLeft} hari lagi · Proyeksi bunga: {fmtFull(maturityInfo.projectedReturn)}
            </div>
          )}
        </div>

        <div className={styles.cardRight}>
          <div>
            <div className={styles.cardAmount}>{fmtFull(metrics.currentValue)}</div>
            <div className={styles.cardSub}>
              Modal: {fmtFull(metrics.costBasis)}
            </div>
            {metrics.unrealizedGain !== 0 && (
              <div className={styles.cardSub} style={{ color: metrics.unrealizedGain >= 0 ? '#22C55E' : '#EF4444' }}>
                {metrics.unrealizedGain >= 0 ? '+' : ''}{fmtFull(metrics.unrealizedGain)}
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button className={`${styles.actionBtn} ${styles.actionBtnBuy}`} onClick={onBuy}>Beli</button>
            {totalUnits > 0 && (
              <button className={`${styles.actionBtn} ${styles.actionBtnSell}`} onClick={onSell}>Jual</button>
            )}
            {!isDeposito && (
              <button className={styles.actionBtn} onClick={onUpdateValue}>Nilai</button>
            )}
            <button className={styles.actionBtn} onClick={onEdit}>
              <NavIcon name="edit" size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction history toggle */}
      {sortedTxs.length > 0 && (
        <>
          <button
            className={styles.toggleBtn}
            onClick={() => setShowHistory((v) => !v)}
          >
            {showHistory ? '▲ Sembunyikan' : '▼ Riwayat transaksi'} ({sortedTxs.length})
          </button>
          {showHistory && (
            <div className={styles.txHistory}>
              <div className={styles.txHistoryTitle}>Riwayat Transaksi</div>
              {sortedTxs.map((tx) => (
                <div key={tx.id} className={styles.txItem}>
                  <span className={styles.txItemDate}>{fmtDate(tx.date)}</span>
                  <span style={{ color: tx.type === 'buy' ? '#16A34A' : '#DC2626' }}>
                    {tx.type === 'buy' ? 'Beli' : 'Jual'} {tx.units} unit
                  </span>
                  <span className={styles.txItemAmount}>
                    {fmtFull(tx.totalAmount)}
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
