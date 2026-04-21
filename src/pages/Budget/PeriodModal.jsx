import { useState } from 'react';
import Modal from '../../components/Modal/Modal';
import Field from '../../components/ui/Field';
import styles from './BudgetPage.module.css';

const DAY_OPTIONS = [1, 5, 10, 15, 20, 21, 22, 23, 24, 25, 26, 27, 28];

/**
 * PeriodModal — Choose budget period mode: standard month or custom billing cycle.
 *
 * "Per Bulan" = standard calendar month (1st – end of month).
 * "Custom Siklus" = billing cycle starting on a chosen day (e.g. 23rd of prev month – 22nd).
 * Useful for users who receive salary on specific dates like the 23rd–25th.
 *
 * @param {Object} props
 * @param {'month'|'cycle'} props.currentMode
 * @param {number} props.currentCycleStart
 * @param {() => void} props.onClose
 * @param {(mode: string, cycleStart: number) => void} props.onSave
 */
export default function PeriodModal({ currentMode, currentCycleStart, onClose, onSave }) {
  const [mode, setMode] = useState(currentMode);
  const [day, setDay] = useState(currentCycleStart > 1 ? currentCycleStart : 25);

  return (
    <Modal title="Atur Periode Budget" onClose={onClose} width={460}>
      <p style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 20, lineHeight: 1.6 }}>
        Pilih bagaimana periode budget dihitung. Jika gaji Anda masuk di pertengahan bulan
        (misal tanggal 23–25), gunakan <strong>Custom Siklus</strong> agar budget sesuai
        dengan siklus pemasukan Anda.
      </p>

      {/* Mode selector */}
      <Field label="Mode Periode">
        <div className={styles.periodModeRow}>
          <button
            className={`${styles.periodModeBtn} ${mode === 'month' ? styles.periodModeBtnActive : ''}`}
            onClick={() => setMode('month')}
          >
            <span className={styles.periodModeIcon}>📅</span>
            <div>
              <div className={styles.periodModeName}>Per Bulan</div>
              <div className={styles.periodModeDesc}>Tanggal 1 – akhir bulan</div>
            </div>
          </button>
          <button
            className={`${styles.periodModeBtn} ${mode === 'cycle' ? styles.periodModeBtnActive : ''}`}
            onClick={() => setMode('cycle')}
          >
            <span className={styles.periodModeIcon}>🔄</span>
            <div>
              <div className={styles.periodModeName}>Custom Siklus</div>
              <div className={styles.periodModeDesc}>Sesuai tanggal gajian</div>
            </div>
          </button>
        </div>
      </Field>

      {/* Cycle start day picker (only shown for custom mode) */}
      {mode === 'cycle' && (
        <Field label="Tanggal Mulai Siklus">
          <div className={styles.dayGrid}>
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={`${styles.dayBtn} ${day === d ? styles.dayBtnActive : ''}`}
              >
                {d}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-5)', marginTop: 10 }}>
            {day <= 1
              ? 'Siklus: 1 – akhir bulan (sama dengan Per Bulan)'
              : `Siklus: tgl ${day} bulan lalu – tgl ${day - 1} bulan berjalan`}
          </p>
          <div className={styles.cycleExample}>
            <span className={styles.cycleExampleLabel}>Contoh:</span>
            {day <= 1
              ? ' 1 Apr – 30 Apr 2026'
              : ` ${day} Mar – ${day - 1} Apr 2026`}
          </div>
        </Field>
      )}

      <button
        className={styles.btnPrimary}
        onClick={() => onSave(mode, mode === 'cycle' ? day : 1)}
      >
        Simpan Pengaturan
      </button>
    </Modal>
  );
}
