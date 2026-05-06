import { useState, useRef, useEffect } from 'react';
import styles from './CategoryPicker.module.css';

const SECTION_LABELS = {
  needs: 'Kebutuhan',
  wants: 'Keinginan',
  savings: 'Tabungan',
  income: 'Pemasukan',
};
const SECTION_ORDER = ['needs', 'wants', 'savings', 'income'];

/**
 * CategoryPicker — Custom dropdown for selecting a category.
 *
 * Shows a trigger button with the selected category (color dot + name).
 * When clicked, opens a dropdown panel with search input and categories
 * grouped by section (Kebutuhan, Keinginan, Tabungan, Pemasukan).
 *
 * @param {Object} props
 * @param {Array} props.categories - Filtered categories (already filtered by tx type)
 * @param {string} props.value - Selected category ID
 * @param {(e: {target: {value: string}}) => void} props.onChange - Callback when category is selected
 */
export default function CategoryPicker({ categories, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Auto-focus search when opened
  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  const selected = categories.find((c) => c.id === value);
  const filtered = search
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  // Group by section
  const grouped = {};
  for (const sec of SECTION_ORDER) {
    const items = filtered
      .filter((c) => c.section === sec)
      .sort((a, b) => a.name.localeCompare(b.name, 'id'));
    if (items.length > 0) grouped[sec] = items;
  }

  const handleSelect = (id) => {
    onChange({ target: { value: id } }); // mimic event shape for compatibility with set('categoryId')
    setOpen(false);
    setSearch('');
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Trigger button */}
      <button type="button" className={styles.trigger} onClick={() => setOpen(!open)}>
        {selected && <span className={styles.dot} style={{ background: selected.color }} />}
        <span className={styles.triggerText}>{selected?.name || 'Pilih kategori'}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className={styles.dropdown}>
          <div className={styles.searchWrap}>
            <input
              ref={searchRef}
              type="text"
              className={styles.searchInput}
              placeholder="Cari kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.list}>
            {Object.keys(grouped).length === 0 && (
              <div className={styles.empty}>Tidak ditemukan</div>
            )}
            {Object.entries(grouped).map(([sec, items]) => (
              <div key={sec}>
                <div className={styles.sectionHeader}>{SECTION_LABELS[sec]}</div>
                {items.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`${styles.item} ${cat.id === value ? styles.itemActive : ''}`}
                    onClick={() => handleSelect(cat.id)}
                  >
                    <span className={styles.dot} style={{ background: cat.color }} />
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
