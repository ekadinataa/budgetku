import { useState } from 'react';
import styles from './HelpChat.module.css';

const FAQ_DATA = [
  {
    id: 'add-tx',
    question: 'Cara tambah transaksi',
    answer: 'Klik tombol + (biru) di bottom bar, atau buka menu Transaksi lalu klik "Tambah". Pilih tipe (Pengeluaran/Pemasukan/Transfer), isi jumlah, pilih kategori dan dompet, lalu simpan.',
  },
  {
    id: 'budget',
    question: 'Cara atur budget',
    answer: 'Buka menu Budget → klik "Atur Pemasukan" untuk set pendapatan bulanan → klik "Edit" di setiap seksi (Kebutuhan/Keinginan/Tabungan) untuk mengalokasikan per kategori. Gunakan panduan 50/30/20 sebagai acuan.',
  },
  {
    id: 'recurring',
    question: 'Apa itu Barang Berkala?',
    answer: 'Barang Berkala adalah fitur untuk tracking item yang dibeli secara berkala (skincare, shampo, pasta gigi, dll). BudgetX menghitung biaya bulanan sebenarnya (amortized cost) dan mengingatkan kapan harus beli ulang.',
  },
  {
    id: 'debt',
    question: 'Cara catat utang/piutang',
    answer: 'Buka menu Utang/Piutang → klik Tambah → pilih tipe (Utang = saya pinjam, Piutang = saya pinjamkan) → isi nama orang dan jumlah. Untuk mencicil, klik "Bayar" pada card utang. Bisa juga aktifkan bunga anuitas untuk pinjaman berbunga.',
  },
  {
    id: 'invest',
    question: 'Cara tracking investasi',
    answer: 'Buka menu Investasi → klik Tambah → pilih jenis aset (Deposito, Saham, Crypto, Emas, dll) → isi detail. Untuk mencatat pembelian/penjualan, klik tombol "Beli" atau "Jual" pada card investasi.',
  },
  {
    id: 'fire',
    question: 'Apa itu FIRE Calculator?',
    answer: 'FIRE (Financial Independence, Retire Early) Calculator membantu merencanakan kapan Anda bisa pensiun dini. Masukkan data keuangan dan lihat proyeksi pertumbuhan portofolio dengan 3 skenario berbeda.',
  },
  {
    id: 'export',
    question: 'Cara export data',
    answer: 'Buka Pengaturan → scroll ke bagian "Export Data" → pilih format JSON (backup lengkap) atau CSV (spreadsheet). File akan terdownload ke perangkat Anda.',
  },
  {
    id: 'theme',
    question: 'Cara ganti tema',
    answer: 'Desktop: klik tombol Dark/Light Mode di sidebar bawah. Mobile: tap avatar di pojok kanan atas → pilih Dark Mode/Light Mode dari menu dropdown.',
  },
  {
    id: 'reset',
    question: 'Cara reset data',
    answer: '⚠️ Hati-hati! Reset akan menghapus SEMUA data. Buka Pengaturan → scroll ke bawah → klik "Reset Data" → ketik "RESET" untuk konfirmasi. Pastikan export data dulu sebelum reset.',
  },
  {
    id: 'contact',
    question: 'Hubungi developer',
    answer: 'BudgetX dikembangkan oleh tim BudgetX. Untuk pertanyaan, saran, atau laporan bug, hubungi kami melalui GitHub: github.com/ekadinataa/budgetku',
  },
];

export default function HelpChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  const handleSelectQuestion = (faq) => {
    setMessages((prev) => [
      ...prev,
      { type: 'user', text: faq.question },
      { type: 'bot', text: faq.answer },
    ]);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
    if (messages.length === 0) {
      setMessages([
        { type: 'bot', text: 'Halo! 👋 Saya asisten BudgetX. Pilih topik di bawah atau tanyakan sesuatu tentang aplikasi ini.' },
      ]);
    }
  };

  return (
    <>
      {/* Chat Panel */}
      {open && (
        <div className={styles.panel}>
          {/* Header */}
          <div className={styles.panelHeader}>
            <div className={styles.panelHeaderLeft}>
              <span className={styles.botAvatar}>🤖</span>
              <div>
                <div className={styles.panelTitle}>Bantuan BudgetX</div>
                <div className={styles.panelSubtitle}>Asisten virtual</div>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={handleClose} aria-label="Tutup bantuan">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            {messages.map((msg, idx) => (
              <div key={idx} className={msg.type === 'bot' ? styles.botMessage : styles.userMessage}>
                {msg.type === 'bot' && <span className={styles.msgAvatar}>🤖</span>}
                <div className={msg.type === 'bot' ? styles.botBubble : styles.userBubble}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <div className={styles.quickActionsInner}>
              {FAQ_DATA.map((faq) => (
                <button
                  key={faq.id}
                  className={styles.quickBtn}
                  onClick={() => handleSelectQuestion(faq)}
                >
                  {faq.question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        className={styles.floatingBtn}
        onClick={open ? handleClose : handleOpen}
        aria-label="Bantuan"
        title="Bantuan"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )}
      </button>
    </>
  );
}
