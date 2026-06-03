import { useState } from 'react';
import styles from './HelpPage.module.css';

const HELP_SECTIONS = [
  {
    id: 'getting-started',
    title: '🚀 Memulai',
    steps: [
      'Daftar akun atau masuk dengan email Anda.',
      'Buat dompet pertama Anda (contoh: BRI, GoPay, Cash).',
      'Catat transaksi pertama dengan menekan tombol "+" di bottom bar.',
      'Atur budget bulanan di menu Budget.',
      'Pantau pengeluaran Anda di Dashboard.',
    ],
  },
  {
    id: 'transactions',
    title: '💸 Transaksi',
    steps: [
      'Klik tombol "+" (biru) di bottom bar untuk menambah transaksi baru.',
      'Pilih tipe: Pengeluaran, Pemasukan, atau Transfer antar dompet.',
      'Isi jumlah, pilih kategori dan dompet sumber.',
      'Tambahkan catatan (opsional) untuk referensi.',
      'Untuk transfer, pilih dompet tujuan.',
      'Edit atau hapus transaksi dari halaman Transaksi.',
      'Gunakan filter untuk mencari transaksi tertentu.',
    ],
  },
  {
    id: 'budget',
    title: '📊 Budget & Anggaran',
    steps: [
      'Buka menu Budget dari sidebar atau bottom nav.',
      'Klik "Atur Pemasukan" untuk memasukkan total pendapatan bulanan.',
      'Alokasikan budget ke 3 seksi: Kebutuhan (50%), Keinginan (30%), Tabungan (20%).',
      'Klik "Edit" pada setiap seksi untuk mengatur alokasi per kategori.',
      'Dashboard akan menampilkan progress penggunaan budget.',
      'Budget yang melebihi alokasi akan ditandai merah.',
    ],
  },
  {
    id: 'recurring',
    title: '🔄 Barang Berkala',
    steps: [
      'Buka menu Berkala untuk mengelola item yang dibeli rutin.',
      'Klik "Tambah" dan isi nama item (contoh: Shampoo, Pasta Gigi).',
      'Masukkan harga, tanggal pembelian terakhir, dan estimasi durasi pemakaian.',
      'BudgetX akan menghitung biaya bulanan (amortized cost).',
      'Notifikasi akan muncul saat item perlu dibeli ulang.',
      'Klik "Beli Ulang" untuk mencatat pembelian dan otomatis membuat transaksi.',
    ],
  },
  {
    id: 'debt',
    title: '🤝 Utang/Piutang',
    steps: [
      'Buka menu Utang/Piutang dari sidebar.',
      'Klik "Tambah" untuk mencatat utang atau piutang baru.',
      'Pilih tipe: Utang (saya pinjam) atau Piutang (saya pinjamkan).',
      'Isi nama orang, jumlah, dan tanggal jatuh tempo (opsional).',
      'Untuk pinjaman berbunga, aktifkan toggle "Bunga Anuitas".',
      'Catat cicilan dengan klik "Bayar" pada card.',
      'Status otomatis berubah ke "Lunas" saat pembayaran selesai.',
    ],
  },
  {
    id: 'investment',
    title: '📈 Investasi',
    steps: [
      'Buka menu Investasi dari sidebar.',
      'Klik "Tambah" untuk menambah aset investasi baru.',
      'Pilih jenis: Deposito, Saham, Reksadana, Crypto, Emas, dll.',
      'Isi detail seperti nama aset dan platform.',
      'Catat pembelian dengan klik "Beli" pada card investasi.',
      'Catat penjualan dengan klik "Jual".',
      'Update nilai saat ini untuk melihat profit/loss.',
    ],
  },
  {
    id: 'fire',
    title: '🔥 FIRE Calculator',
    steps: [
      'Akses FIRE Calculator dari Pengaturan → Alat Keuangan.',
      'Masukkan data: pengeluaran bulanan, portfolio saat ini, tabungan per bulan.',
      'Atur asumsi: inflasi, return investasi, safe withdrawal rate.',
      'Lihat proyeksi waktu mencapai FIRE number.',
      'Bandingkan 3 skenario: konservatif, moderat, agresif.',
      'Sesuaikan strategi berdasarkan hasil simulasi.',
    ],
  },
  {
    id: 'reports',
    title: '📋 Laporan',
    steps: [
      'Buka menu Laporan untuk analisis keuangan.',
      'Lihat ringkasan bulanan: pemasukan vs pengeluaran.',
      'Analisis pengeluaran per kategori dengan chart.',
      'Bandingkan tren pengeluaran antar bulan.',
      'Gunakan filter periode untuk melihat rentang tertentu.',
    ],
  },
  {
    id: 'settings',
    title: '⚙️ Pengaturan',
    steps: [
      'Export data ke JSON (backup lengkap) atau CSV (spreadsheet).',
      'Import data dari file backup untuk memulihkan data.',
      'Kelola kategori: tambah, edit, atau hapus kategori.',
      'Ganti tema: Dark Mode atau Light Mode.',
      'Reset data: menghapus semua data (irreversible, export dulu!).',
    ],
  },
  {
    id: 'tips',
    title: '💡 Tips Keuangan',
    steps: [
      'Gunakan aturan 50/30/20: 50% kebutuhan, 30% keinginan, 20% tabungan.',
      'Catat SEMUA pengeluaran, sekecil apapun — awareness adalah langkah pertama.',
      'Review budget mingguan untuk tetap on track.',
      'Siapkan dana darurat minimal 3-6 bulan pengeluaran.',
      'Automasi tabungan: alokasikan di awal bulan, bukan sisa akhir bulan.',
      'Gunakan fitur Barang Berkala untuk tahu "biaya hidup sebenarnya".',
      'Pantau rasio utang — idealnya cicilan < 30% dari pendapatan.',
    ],
  },
];

export default function HelpPage({ setPage }) {
  const [expanded, setExpanded] = useState(null);

  const toggleSection = (id) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => setPage('settings')} aria-label="Kembali">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className={styles.title}>Bantuan &amp; Panduan</h1>
      </div>

      <p className={styles.subtitle}>
        Panduan lengkap menggunakan BudgetX. Klik topik untuk melihat langkah-langkahnya.
      </p>

      {/* Accordion Sections */}
      <div className={styles.accordion}>
        {HELP_SECTIONS.map((section) => {
          const isOpen = expanded === section.id;
          return (
            <div key={section.id} className={`${styles.section} ${isOpen ? styles.sectionOpen : ''}`}>
              <button
                className={styles.sectionHeader}
                onClick={() => toggleSection(section.id)}
                aria-expanded={isOpen}
              >
                <span className={styles.sectionTitle}>{section.title}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {isOpen && (
                <div className={styles.sectionContent}>
                  <ol className={styles.stepsList}>
                    {section.steps.map((step, idx) => (
                      <li key={idx} className={styles.step}>
                        <span className={styles.stepNumber}>{idx + 1}</span>
                        <span className={styles.stepText}>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
