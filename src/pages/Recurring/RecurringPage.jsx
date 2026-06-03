import { useState, useMemo } from 'react';
import { fmtFull, fmt } from '../../utils/formatters';
import { getCatById } from '../../utils/helpers';
import {
  getTotalAmortizedCost,
  getAmortizedMonthlyCost,
  groupByStatus,
  formatDaysRemaining,
  formatDuration,
} from '../../utils/recurring';
import NavIcon from '../../components/icons/NavIcon';
import RecurringFormModal from './RecurringFormModal';
import RepurchaseModal from './RepurchaseModal';
import styles from './RecurringPage.module.css';

/**
 * RecurringPage — Manage recurring/periodic purchase items.
 *
 * Displays items grouped by restock urgency, shows amortized monthly cost,
 * and provides CRUD + repurchase flow.
 *
 * @param {Object} props
 * @param {Array} props.recurringItems - All recurring items
 * @param {Array} props.categories - All categories
 * @param {Array} props.wallets - All wallets
 * @param {(data: Object) => Promise} props.onCreateItem - Create handler
 * @param {(id: string, data: Object) => Promise} props.onUpdateItem - Update handler
 * @param {(id: string) => Promise} props.onDeleteItem - Delete handler
 * @param {(id: string, data: Object) => Promise} props.onRepurchase - Repurchase handler
 */
export default function RecurringPage({
  recurringItems,
  categories,
  wallets,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  onRepurchase,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [repurchaseItem, setRepurchaseItem] = useState(null);

  const getCat = (id) => getCatById(id, categories);

  // Group items by status
  const { needsRestock, available, inactive } = useMemo(
    () => groupByStatus(recurringItems),
    [recurringItems]
  );

  // Summary stats
  const activeItems = recurringItems.filter((i) => i.isActive);
  const totalAmortized = getTotalAmortizedCost(recurringItems);

  // Handlers
  const handleSave = async (data) => {
    if (editItem) {
      await onUpdateItem(editItem.id, data);
    } else {
      await onCreateItem(data);
    }
    setShowForm(false);
    setEditItem(null);
  };

  const handleDelete = async (id) => {
    await onDeleteItem(id);
    setShowForm(false);
    setEditItem(null);
  };

  const handleRepurchase = async (data) => {
    await onRepurchase(repurchaseItem.id, data);
    setRepurchaseItem(null);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setShowForm(true);
  };

  const handleToggleActive = async (item) => {
    await onUpdateItem(item.id, { isActive: !item.isActive });
  };

  return (
    <div>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Barang Berkala</h1>
          <p className={styles.pageSubtitle}>
            Kelola item yang dibeli secara berkala (skincare, shampo, dll)
          </p>
        </div>
        <button className={styles.addBtn} onClick={() => { setEditItem(null); setShowForm(true); }}>
          <NavIcon name="plus" size={16} /> Tambah Item
        </button>
      </div>

      {/* Summary cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Biaya Bulanan (Amortized)</div>
          <div className={styles.summaryValue} style={{ color: '#4F6EF7' }}>
            {fmtFull(Math.round(totalAmortized))}
          </div>
          <div className={styles.summarySub}>per bulan dari {activeItems.length} item aktif</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Perlu Restock</div>
          <div className={styles.summaryValue} style={{ color: needsRestock.length > 0 ? '#DC2626' : '#22C55E' }}>
            {needsRestock.length}
          </div>
          <div className={styles.summarySub}>item dalam 7 hari ke depan</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Item</div>
          <div className={styles.summaryValue}>{recurringItems.length}</div>
          <div className={styles.summarySub}>
            {activeItems.length} aktif · {inactive.length} non-aktif
          </div>
        </div>
      </div>

      {/* Empty state */}
      {recurringItems.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📦</div>
          <div className={styles.emptyTitle}>Belum ada barang berkala</div>
          <div className={styles.emptyDesc}>
            Tambahkan item yang kamu beli secara berkala seperti skincare, shampo, pasta gigi, dll.
            BudgetX akan menghitung biaya bulanan sebenarnya dan mengingatkan kapan harus beli ulang.
          </div>
          <button className={styles.addBtn} onClick={() => setShowForm(true)} style={{ margin: '0 auto' }}>
            <NavIcon name="plus" size={16} /> Tambah Item Pertama
          </button>
        </div>
      )}

      {/* Needs Restock Section */}
      {needsRestock.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <span style={{ color: '#DC2626' }}>🔴</span> Perlu Restock
            <span className={styles.sectionBadge}>{needsRestock.length}</span>
          </div>
          {needsRestock.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              getCat={getCat}
              urgent
              onEdit={() => handleEdit(item)}
              onRepurchase={() => setRepurchaseItem(item)}
              onToggleActive={() => handleToggleActive(item)}
            />
          ))}
        </div>
      )}

      {/* Available Section */}
      {available.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <span style={{ color: '#22C55E' }}>✅</span> Masih Tersedia
            <span className={styles.sectionBadge}>{available.length}</span>
          </div>
          {available.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              getCat={getCat}
              onEdit={() => handleEdit(item)}
              onRepurchase={() => setRepurchaseItem(item)}
              onToggleActive={() => handleToggleActive(item)}
            />
          ))}
        </div>
      )}

      {/* Inactive Section */}
      {inactive.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>⏸️</span> Non-aktif
            <span className={styles.sectionBadge}>{inactive.length}</span>
          </div>
          {inactive.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              getCat={getCat}
              inactive
              onEdit={() => handleEdit(item)}
              onToggleActive={() => handleToggleActive(item)}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <RecurringFormModal
          initial={editItem}
          categories={categories}
          wallets={wallets}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSave={handleSave}
          onDelete={editItem ? handleDelete : undefined}
        />
      )}

      {/* Repurchase Modal */}
      {repurchaseItem && (
        <RepurchaseModal
          item={repurchaseItem}
          wallets={wallets}
          onClose={() => setRepurchaseItem(null)}
          onConfirm={handleRepurchase}
        />
      )}
    </div>
  );
}

/**
 * ItemCard — Single recurring item display card.
 */
function ItemCard({ item, getCat, urgent, inactive, onEdit, onRepurchase, onToggleActive }) {
  const cat = getCat(item.categoryId);
  const amortized = getAmortizedMonthlyCost(item.amount, item.durationDays);
  const daysLeft = item._daysLeft;

  const getStatusClass = () => {
    if (inactive) return '';
    if (daysLeft <= 0) return styles.statusUrgent;
    if (daysLeft <= 7) return styles.statusSoon;
    return styles.statusOk;
  };

  return (
    <div className={`${styles.card} ${urgent ? styles.cardUrgent : ''}`}>
      <div className={styles.itemRow}>
        <div
          className={styles.itemIcon}
          style={{
            background: (cat?.color || '#94A3B8') + '18',
            color: cat?.color || '#94A3B8',
          }}
        >
          {item.name.charAt(0).toUpperCase()}
        </div>

        <div className={styles.itemInfo}>
          <div className={styles.itemName}>{item.name}</div>
          <div className={styles.itemMeta}>
            <span>{cat?.name || '—'}</span>
            <span>·</span>
            <span>{formatDuration(item.durationDays)}</span>
            {item.note && (
              <>
                <span>·</span>
                <span>{item.note}</span>
              </>
            )}
          </div>
        </div>

        <div className={styles.itemRight}>
          <div>
            <div className={styles.itemAmount}>{fmtFull(item.amount)}</div>
            <div className={styles.itemAmortized}>{fmt(Math.round(amortized))}/bln</div>
          </div>

          {!inactive && daysLeft !== undefined && (
            <span className={`${styles.itemStatus} ${getStatusClass()}`}>
              {formatDaysRemaining(daysLeft)}
            </span>
          )}

          {!inactive && onRepurchase && (
            <button className={styles.repurchaseBtn} onClick={onRepurchase}>
              Sudah Beli
            </button>
          )}

          <div className={styles.actions}>
            <button className={styles.actionBtn} onClick={onEdit} title="Edit">
              <NavIcon name="edit" size={14} />
            </button>
            <button className={styles.actionBtn} onClick={onToggleActive} title={inactive ? 'Aktifkan' : 'Non-aktifkan'}>
              <NavIcon name={inactive ? 'check' : 'close'} size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
