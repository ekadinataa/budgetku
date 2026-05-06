import { useState } from 'react';
import Modal from '../../components/Modal/Modal';

/**
 * ImportConfirmModal — Displays import summary and lets user choose
 * Replace or Append mode before applying the import.
 *
 * @param {Object} props
 * @param {{ wallets: number, transactions: number, budgets: number, categories: number }} props.importSummary
 * @param {(mode: 'replace' | 'append') => Promise<void>} props.onConfirm
 * @param {() => void} props.onClose
 * @param {string|null} props.error
 * @param {boolean} props.loading
 */
export default function ImportConfirmModal({ importSummary, onConfirm, onClose, error, loading, isCsvImport }) {
  const [selectedMode, setSelectedMode] = useState(null);

  const handleConfirm = async (mode) => {
    setSelectedMode(mode);
    await onConfirm(mode);
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  const summaryText = [
    importSummary.wallets > 0 && `${importSummary.wallets} dompet`,
    importSummary.transactions > 0 && `${importSummary.transactions} transaksi`,
    importSummary.budgets > 0 && `${importSummary.budgets} anggaran`,
    importSummary.categories > 0 && `${importSummary.categories} kategori`,
  ].filter(Boolean).join(', ');

  return (
    <Modal title="Impor Data" onClose={handleClose} width={480}>
      {/* Summary */}
      <div style={{
        background: 'var(--bg-2)',
        borderRadius: 10,
        padding: '14px 16px',
        marginBottom: 20,
        border: '1px solid var(--border-2)',
      }}>
        <p style={{
          fontSize: 13,
          color: 'var(--text-4)',
          margin: '0 0 4px',
          fontWeight: 600,
        }}>
          Data ditemukan:
        </p>
        <p style={{
          fontSize: 14,
          color: 'var(--text-1)',
          margin: 0,
          fontWeight: 500,
        }}>
          {summaryText || 'Tidak ada data'}
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          background: '#FFFBEB',
          borderRadius: 8,
          marginBottom: 16,
        }}>
          <div style={{
            width: 18,
            height: 18,
            border: '2px solid #D97706',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#B45309' }}>
            {selectedMode === 'replace' ? 'Mengganti data...' : 'Menggabungkan data...'}
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#991B1B',
          background: '#FEE2E2',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* Mode selection */}
      {!loading && (
        <>
          {isCsvImport ? (
            <>
              <p style={{
                fontSize: 13,
                color: 'var(--text-4)',
                marginBottom: 16,
                fontWeight: 500,
              }}>
                Transaksi dari file CSV akan ditambahkan ke data yang ada.
                {importSummary.categories > 0 && ` ${importSummary.categories} kategori baru akan dibuat otomatis.`}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  onClick={handleClose}
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg-2)',
                    color: 'var(--text-3)',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={() => handleConfirm('append')}
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#4F6EF7',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  Impor
                </button>
              </div>
            </>
          ) : (
          <>
          <p style={{
            fontSize: 13,
            color: 'var(--text-4)',
            marginBottom: 12,
            fontWeight: 600,
          }}>
            Pilih metode impor:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {/* Replace mode card */}
            <button
              onClick={() => handleConfirm('replace')}
              disabled={loading}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '14px 16px',
                borderRadius: 10,
                border: '1.5px solid var(--border)',
                background: 'var(--bg-card)',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>
                Ganti Semua (Replace)
              </div>
              <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 500 }}>
                ⚠️ Semua data yang ada akan dihapus dan diganti dengan data impor
              </div>
            </button>

            {/* Append mode card */}
            <button
              onClick={() => handleConfirm('append')}
              disabled={loading}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '14px 16px',
                borderRadius: 10,
                border: '1.5px solid var(--border)',
                background: 'var(--bg-card)',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>
                Gabungkan (Append)
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-4)', fontWeight: 500 }}>
                Data baru akan ditambahkan, data yang sudah ada tidak berubah
              </div>
            </button>
          </div>

          {/* Cancel button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleClose}
              disabled={loading}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1.5px solid var(--border)',
                background: 'var(--bg-2)',
                color: 'var(--text-3)',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
            >
              Batal
            </button>
          </div>
          </>
          )}
        </>
      )}
    </Modal>
  );
}
