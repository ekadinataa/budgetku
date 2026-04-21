import { useState } from 'react';
import Modal from '../../components/Modal/Modal';
import Field from '../../components/ui/Field';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import NavIcon from '../../components/icons/NavIcon';
import { sectionLabel } from '../../utils/helpers';
import { fmtFull } from '../../utils/formatters';
import styles from './BudgetPage.module.css';

const COLORS = [
  '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899',
  '#F97316', '#22C55E', '#14B8A6', '#A855F7', '#10B981', '#64748B',
];

/**
 * SectionEditModal — Modal for editing a budget section's total and per-category allocations.
 *
 * Allows setting the section total, adjusting per-category amounts, adding existing
 * categories from the section, creating new custom categories, and inline editing
 * of category name/color.
 *
 * @param {Object} props
 * @param {string} props.section - Section key ('needs' | 'wants' | 'savings')
 * @param {{ total: number, cats: Array<{ id: string, amt: number }> }} props.data - Current section data
 * @param {() => void} props.onClose - Close callback
 * @param {(data: { total: number, cats: Array }) => void} props.onSave - Save callback
 * @param {Array} props.categories - Global categories list
 * @param {(fn: (cats: Array) => Array) => void} props.setCategories - Categories setter
 *
 * Requirements: 5.5, 5.6, 5.7
 */
export default function SectionEditModal({
  section,
  data,
  onClose,
  onSave,
  categories,
  setCategories,
  onCreateCategory,
  onUpdateCategory,
}) {
  const getCat = (id) => categories.find((c) => c.id === id);
  const availCats = categories.filter((c) => c.section === section);

  const [total, setTotal] = useState(String(data.total));
  const [cats, setCats] = useState(
    data.cats.map((c) => ({ ...c, amt: String(c.amt) })),
  );
  const [newCat, setNewCat] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showCustom, setShowCustom] = useState(false);
  const [customForm, setCustomForm] = useState({ name: '', color: '#64748B' });

  const addCat = () => {
    if (!newCat || cats.find((c) => c.id === newCat)) return;
    setCats((cs) => [...cs, { id: newCat, amt: '0' }]);
    setNewCat('');
  };

  const removeCat = (id) => setCats((cs) => cs.filter((c) => c.id !== id));

  const setAmt = (id, v) =>
    setCats((cs) => cs.map((c) => (c.id === id ? { ...c, amt: v } : c)));

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, color: cat.color });
  };

  const saveEdit = async (id) => {
    try {
      if (onUpdateCategory) {
        const cat = getCat(id);
        await onUpdateCategory(id, { name: editForm.name, section: cat?.section || section, color: editForm.color });
      } else {
        setCategories((cs) =>
          cs.map((c) => (c.id === id ? { ...c, ...editForm } : c)),
        );
      }
    } catch {
      // Fallback to local update
      setCategories((cs) =>
        cs.map((c) => (c.id === id ? { ...c, ...editForm } : c)),
      );
    }
    setEditingId(null);
  };

  const addCustom = async () => {
    if (!customForm.name.trim()) return;
    const catData = {
      name: customForm.name.trim(),
      section,
      color: customForm.color,
    };
    try {
      if (onCreateCategory) {
        const created = await onCreateCategory(catData);
        setCats((cs) => [...cs, { id: created.id, amt: '0' }]);
      } else {
        const newId = 'c_' + Date.now();
        setCategories((cs) => [...cs, { id: newId, ...catData }]);
        setCats((cs) => [...cs, { id: newId, amt: '0' }]);
      }
    } catch {
      // Fallback to local
      const newId = 'c_' + Date.now();
      setCategories((cs) => [...cs, { id: newId, ...catData }]);
      setCats((cs) => [...cs, { id: newId, amt: '0' }]);
    }
    setCustomForm({ name: '', color: '#64748B' });
    setShowCustom(false);
  };

  const catSum = cats.reduce((s, c) => s + (parseFloat(c.amt) || 0), 0);
  const totalVal = parseFloat(total) || 0;
  const diff = totalVal - catSum;
  const over = diff < 0;

  const handleSave = () => {
    onSave({
      total: totalVal,
      cats: cats.map((c) => ({ id: c.id, amt: parseFloat(c.amt) || 0 })),
    });
  };

  const unusedCats = availCats.filter((c) => !cats.find((cc) => cc.id === c.id));

  return (
    <Modal
      title={`Edit Budget · ${sectionLabel(section)}`}
      onClose={onClose}
      width={540}
    >
      <Field label={`Total Anggaran ${sectionLabel(section)} (Rp)`}>
        <Input
          type="number"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          placeholder="0"
        />
      </Field>

      {/* Allocation status bar */}
      <div
        className={`${styles.allocBar} ${
          over
            ? styles.allocBarOver
            : diff > 0
              ? styles.allocBarUnder
              : styles.allocBarMatch
        }`}
      >
        <span className={styles.allocBarLabel}>
          Dialokasikan ke kategori:{' '}
          <strong>{fmtFull(catSum)}</strong>
        </span>
        {diff !== 0 && (
          <span className={styles.allocBarStatus}>
            {over
              ? `⚠ Melebihi ${fmtFull(-diff)}`
              : `Belum dialokasikan: ${fmtFull(diff)}`}
          </span>
        )}
        {diff === 0 && (
          <span className={styles.allocBarStatus}>✓ Sesuai</span>
        )}
      </div>

      {/* Category list */}
      <div className={styles.catList}>
        {cats.map((c) => {
          const cat = getCat(c.id);
          const isEditing = editingId === c.id;

          if (isEditing) {
            return (
              <div key={c.id} className={styles.inlineEdit}>
                <div className={styles.inlineEditRow}>
                  <Input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                    }
                    style={{ flex: 1 }}
                    placeholder="Nama kategori"
                  />
                </div>
                <div className={styles.colorPicker}>
                  {COLORS.map((col) => (
                    <button
                      key={col}
                      onClick={() =>
                        setEditForm((f) => ({ ...f, color: col }))
                      }
                      className={`${styles.colorSwatch} ${
                        editForm.color === col ? styles.colorSwatchSelected : ''
                      }`}
                      style={{ background: col }}
                      aria-label={`Color ${col}`}
                    />
                  ))}
                </div>
                <div className={styles.inlineEditActions}>
                  <button
                    className={styles.btnSmallPrimary}
                    onClick={() => saveEdit(c.id)}
                  >
                    <NavIcon name="check" size={13} /> Simpan
                  </button>
                  <button
                    className={styles.btnSmallGhost}
                    onClick={() => setEditingId(null)}
                  >
                    Batal
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={c.id} className={styles.catRow}>
              <div
                className={styles.catRowDot}
                style={{ background: cat?.color || 'var(--text-6)' }}
              />
              <span className={styles.catRowName}>
                {cat?.name || c.id}
              </span>
              <Input
                type="number"
                value={c.amt}
                onChange={(e) => setAmt(c.id, e.target.value)}
                style={{ width: 130 }}
              />
              <button
                className={styles.iconBtn}
                onClick={() => cat && startEdit(cat)}
                aria-label="Edit category"
              >
                <NavIcon name="edit" size={14} />
              </button>
              <button
                className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                onClick={() => removeCat(c.id)}
                aria-label="Remove category"
              >
                <NavIcon name="trash" size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add existing category */}
      {unusedCats.length > 0 ? (
        <div className={styles.addCatRow}>
          <Select
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">+ Tambah kategori</option>
            {unusedCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <button className={styles.btnSmallGhost} onClick={addCat}>
            Tambah
          </button>
        </div>
      ) : (
        <div className={styles.allCatsMsg}>
          Semua kategori sudah ditambahkan.
        </div>
      )}

      {/* Create custom category */}
      {showCustom ? (
        <div className={styles.customCatForm}>
          <div className={styles.customCatTitle}>Kategori Baru</div>
          <Input
            value={customForm.name}
            onChange={(e) =>
              setCustomForm((f) => ({ ...f, name: e.target.value }))
            }
            placeholder="Nama kategori"
            style={{ marginBottom: 8 }}
          />
          <div className={styles.colorPicker}>
            {COLORS.map((col) => (
              <button
                key={col}
                onClick={() =>
                  setCustomForm((f) => ({ ...f, color: col }))
                }
                className={`${styles.colorSwatch} ${
                  customForm.color === col ? styles.colorSwatchSelected : ''
                }`}
                style={{ background: col }}
                aria-label={`Color ${col}`}
              />
            ))}
          </div>
          <div className={styles.inlineEditActions}>
            <button className={styles.btnSmallPrimary} onClick={addCustom}>
              <NavIcon name="plus" size={13} /> Buat
            </button>
            <button
              className={styles.btnSmallGhost}
              onClick={() => setShowCustom(false)}
            >
              Batal
            </button>
          </div>
        </div>
      ) : (
        <button
          className={styles.createCatBtn}
          onClick={() => setShowCustom(true)}
        >
          <NavIcon name="plus" size={13} /> Buat Kategori Baru
        </button>
      )}

      <button className={styles.btnPrimary} onClick={handleSave}>
        Simpan
      </button>
    </Modal>
  );
}
