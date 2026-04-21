/**
 * MultiChip — Multi-select filter using clickable chips/pills.
 *
 * Shows an "All" chip plus one chip per option. Clicking toggles selection.
 * When all are deselected or "All" is clicked, it resets to show everything.
 *
 * @param {Object} props
 * @param {{ value: string, label: string, color?: string }[]} props.options
 * @param {Set<string>} props.selected - Set of selected values (empty = all)
 * @param {(selected: Set<string>) => void} props.onChange
 * @param {string} [props.allLabel='Semua'] - Label for the "all" chip
 */
export default function MultiChip({ options, selected, onChange, allLabel = 'Semua' }) {
  const allSelected = selected.size === 0;

  const toggle = (val) => {
    const next = new Set(selected);
    if (next.has(val)) {
      next.delete(val);
    } else {
      next.add(val);
    }
    // If all options are now selected, reset to empty (= all)
    if (next.size === options.length) {
      onChange(new Set());
    } else {
      onChange(next);
    }
  };

  const selectAll = () => onChange(new Set());

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      <button
        onClick={selectAll}
        style={{
          padding: '4px 12px',
          borderRadius: 99,
          border: '1.5px solid',
          borderColor: allSelected ? '#4F6EF7' : 'var(--border)',
          background: allSelected ? 'rgba(79,110,247,0.1)' : 'var(--bg-card)',
          color: allSelected ? '#4F6EF7' : 'var(--text-4)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}
      >
        {allLabel}
      </button>
      {options.map((opt) => {
        const active = selected.has(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            style={{
              padding: '4px 12px',
              borderRadius: 99,
              border: '1.5px solid',
              borderColor: active ? (opt.color || '#4F6EF7') : 'var(--border)',
              background: active ? (opt.color || '#4F6EF7') + '18' : 'var(--bg-card)',
              color: active ? (opt.color || '#4F6EF7') : 'var(--text-4)',
              fontSize: 12,
              fontWeight: active ? 600 : 400,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
