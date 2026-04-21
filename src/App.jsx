import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar/Sidebar';
import DataMigrator from './components/DataMigrator';
import Dashboard from './pages/Dashboard/Dashboard';
import WalletPage from './pages/Wallet/WalletPage';
import TransactionsPage from './pages/Transactions/TransactionsPage';
import BudgetPage from './pages/Budget/BudgetPage';
import ReportsPage from './pages/Reports/ReportsPage';
import TxFormModal from './pages/Transactions/TxFormModal';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import { STORAGE_KEY } from './utils/constants';
import * as api from './services/api';
import './App.css';

function App() {
  const { user, loading: authLoading, login, register, logout, resetPassword } = useAuth();

  // Auth page navigation (login, register, forgot)
  const [authPage, setAuthPage] = useState('login');

  // App data state
  const [page, setPage] = useState('dashboard');
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [categories, setCategories] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [cycleStart, setCycleStart] = useState(1);

  // Loading & error states
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [toast, setToast] = useState('');

  // Migration state
  const [showMigrator, setShowMigrator] = useState(false);
  const [migrationChecked, setMigrationChecked] = useState(false);

  // Global "Add Transaction" modal state
  const [showAddTx, setShowAddTx] = useState(false);

  // Show toast notification
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }, []);

  // Fetch all data from API when authenticated
  const fetchAllData = useCallback(async () => {
    setDataLoading(true);
    setDataError('');
    try {
      // Initialize default data for new users (no-op if already initialized)
      await api.initUser();

      const [walletsData, txData, budgetsData, catsData, prefsData] = await Promise.all([
        api.getWallets(),
        api.getTransactions(),
        api.getBudgets(),
        api.getCategories(),
        api.getPreferences(),
      ]);
      setWallets(walletsData);
      setTransactions(txData);
      // budgets come as array from API, convert to object keyed by monthKey
      if (Array.isArray(budgetsData)) {
        const budgetMap = {};
        budgetsData.forEach((b) => {
          const key = b.id || b.monthKey;
          if (key) {
            const { id, monthKey, ...rest } = b;
            budgetMap[key] = rest;
          }
        });
        setBudgets(budgetMap);
      } else {
        setBudgets(budgetsData || {});
      }
      setCategories(catsData);
      if (prefsData) {
        if (prefsData.darkMode !== undefined) setDarkMode(prefsData.darkMode);
        if (prefsData.cycleStart !== undefined) setCycleStart(prefsData.cycleStart);
        if (prefsData.page !== undefined) setPage(prefsData.page);
      }
    } catch (err) {
      setDataError('Gagal memuat data. Periksa koneksi Anda.');
      showToast('Gagal memuat data dari server.');
    } finally {
      setDataLoading(false);
    }
  }, [showToast]);

  // When user becomes authenticated, check for migration then fetch data
  useEffect(() => {
    if (user && !authLoading) {
      // Check if localStorage has data to migrate
      const hasLocalData = localStorage.getItem(STORAGE_KEY);
      if (hasLocalData && !migrationChecked) {
        setShowMigrator(true);
      } else {
        fetchAllData();
      }
    }
  }, [user, authLoading, migrationChecked, fetchAllData]);

  // Save preferences to API when they change (debounced via user interaction)
  const savePreferences = useCallback(async (prefs) => {
    if (!user) return;
    try {
      await api.updatePreferences(prefs);
    } catch {
      // Silent fail for preferences
    }
  }, [user]);

  // Wrap setDarkMode to also persist to API
  const handleSetDarkMode = useCallback((valOrFn) => {
    setDarkMode((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      savePreferences({ darkMode: next, cycleStart, page });
      return next;
    });
  }, [cycleStart, page, savePreferences]);

  // Wrap setCycleStart to also persist to API
  const handleSetCycleStart = useCallback((valOrFn) => {
    setCycleStart((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      savePreferences({ darkMode, cycleStart: next, page });
      return next;
    });
  }, [darkMode, page, savePreferences]);

  // ── Auth pages (not authenticated) ─────────────────────────────────
  if (authLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', width: '100vw', background: 'var(--bg)',
      }}>
        <div style={{ textAlign: 'center', color: 'var(--text-4)' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid var(--border)',
            borderTopColor: '#4F6EF7', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <div style={{ fontSize: 14 }}>Memuat...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    switch (authPage) {
      case 'register':
        return <RegisterPage onRegister={register} onNavigate={setAuthPage} />;
      case 'forgot':
        return <ForgotPasswordPage onResetPassword={resetPassword} onNavigate={setAuthPage} />;
      default:
        return <LoginPage onLogin={login} onNavigate={setAuthPage} />;
    }
  }

  // ── Migration prompt ───────────────────────────────────────────────
  if (showMigrator && !migrationChecked) {
    return (
      <ThemeProvider darkMode={darkMode} setDarkMode={handleSetDarkMode}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100vh', width: '100vw', background: 'var(--bg)',
        }}>
          <DataMigrator
            onComplete={() => {
              setShowMigrator(false);
              setMigrationChecked(true);
              fetchAllData();
            }}
          />
        </div>
      </ThemeProvider>
    );
  }

  // ── Data loading state ─────────────────────────────────────────────
  if (dataLoading) {
    return (
      <ThemeProvider darkMode={darkMode} setDarkMode={handleSetDarkMode}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100vh', width: '100vw', background: 'var(--bg)',
        }}>
          <div style={{ textAlign: 'center', color: 'var(--text-4)' }}>
            <div style={{
              width: 40, height: 40, border: '3px solid var(--border)',
              borderTopColor: '#4F6EF7', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
            }} />
            <div style={{ fontSize: 14 }}>Memuat data...</div>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </ThemeProvider>
    );
  }

  if (dataError && wallets.length === 0) {
    return (
      <ThemeProvider darkMode={darkMode} setDarkMode={handleSetDarkMode}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100vh', width: '100vw', background: 'var(--bg)', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ color: '#EF4444', fontSize: 15 }}>{dataError}</div>
          <button
            onClick={fetchAllData}
            style={{
              padding: '10px 24px', borderRadius: 8, border: 'none',
              background: '#4F6EF7', color: '#fff', fontSize: 14,
              fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Coba Lagi
          </button>
        </div>
      </ThemeProvider>
    );
  }

  // ── Helpers for API-backed state updates ───────────────────────────

  /** Create a wallet via API and update local state */
  const handleCreateWallet = async (data) => {
    try {
      const created = await api.createWallet(data);
      setWallets((ws) => [...ws, created]);
      return created;
    } catch (err) {
      showToast(err.message || 'Gagal membuat dompet.');
      throw err;
    }
  };

  /** Update a wallet via API and update local state */
  const handleUpdateWallet = async (id, data) => {
    try {
      const updated = await api.updateWallet(id, data);
      setWallets((ws) => ws.map((w) => (w.id === id ? updated : w)));
      return updated;
    } catch (err) {
      showToast(err.message || 'Gagal mengubah dompet.');
      throw err;
    }
  };

  /** Delete a wallet via API and update local state */
  const handleDeleteWallet = async (id) => {
    try {
      await api.deleteWallet(id);
      setWallets((ws) => ws.filter((w) => w.id !== id));
    } catch (err) {
      showToast(err.message || 'Gagal menghapus dompet.');
      throw err;
    }
  };

  /** Create a transaction via API and update local state (including wallet balances) */
  const handleCreateTransaction = async (data) => {
    try {
      const created = await api.createTransaction(data);
      setTransactions((ts) => [created, ...ts]);
      // Refresh wallets to get updated balances
      const freshWallets = await api.getWallets();
      setWallets(freshWallets);
      return created;
    } catch (err) {
      showToast(err.message || 'Gagal membuat transaksi.');
      throw err;
    }
  };

  /** Update a transaction via API and update local state */
  const handleUpdateTransaction = async (id, data) => {
    try {
      const updated = await api.updateTransaction(id, data);
      setTransactions((ts) => ts.map((t) => (t.id === id ? updated : t)));
      // Refresh wallets to get updated balances
      const freshWallets = await api.getWallets();
      setWallets(freshWallets);
      return updated;
    } catch (err) {
      showToast(err.message || 'Gagal mengubah transaksi.');
      throw err;
    }
  };

  /** Delete a transaction via API and update local state */
  const handleDeleteTransaction = async (id) => {
    try {
      await api.deleteTransaction(id);
      setTransactions((ts) => ts.filter((t) => t.id !== id));
      // Refresh wallets to get updated balances
      const freshWallets = await api.getWallets();
      setWallets(freshWallets);
    } catch (err) {
      showToast(err.message || 'Gagal menghapus transaksi.');
      throw err;
    }
  };

  /** Update budgets via API and update local state */
  const handleSetBudgets = async (valOrFn) => {
    const newBudgets = typeof valOrFn === 'function' ? valOrFn(budgets) : valOrFn;
    setBudgets(newBudgets);
    // Find which month keys changed and update them
    for (const [monthKey, data] of Object.entries(newBudgets)) {
      if (JSON.stringify(budgets[monthKey]) !== JSON.stringify(data)) {
        try {
          await api.updateBudget(monthKey, data);
        } catch (err) {
          showToast(err.message || 'Gagal menyimpan budget.');
        }
      }
    }
  };

  /** Create a category via API and update local state */
  const handleCreateCategory = async (data) => {
    try {
      const created = await api.createCategory(data);
      setCategories((cs) => [...cs, created]);
      return created;
    } catch (err) {
      showToast(err.message || 'Gagal membuat kategori.');
      throw err;
    }
  };

  /** Update a category via API and update local state */
  const handleUpdateCategory = async (id, data) => {
    try {
      const updated = await api.updateCategory(id, data);
      setCategories((cs) => cs.map((c) => (c.id === id ? updated : c)));
      return updated;
    } catch (err) {
      showToast(err.message || 'Gagal mengubah kategori.');
      throw err;
    }
  };

  /** Delete a category via API and update local state */
  const handleDeleteCategory = async (id) => {
    try {
      await api.deleteCategory(id);
      setCategories((cs) => cs.filter((c) => c.id !== id));
    } catch (err) {
      showToast(err.message || 'Gagal menghapus kategori.');
      throw err;
    }
  };

  // ── Wrapped setters that pass API-backed functions to child components ──
  // These wrap the state setters so child components can call them the same way
  // but the changes go through the API.

  const apiSetWallets = (valOrFn) => {
    // For direct state updates from child components that manage their own API calls
    if (typeof valOrFn === 'function') {
      setWallets(valOrFn);
    } else {
      setWallets(valOrFn);
    }
  };

  const apiSetTransactions = (valOrFn) => {
    if (typeof valOrFn === 'function') {
      setTransactions(valOrFn);
    } else {
      setTransactions(valOrFn);
    }
  };

  const apiSetCategories = (valOrFn) => {
    if (typeof valOrFn === 'function') {
      setCategories(valOrFn);
    } else {
      setCategories(valOrFn);
    }
  };

  /** Callback passed to Dashboard to open the global add-transaction modal */
  const onAddTx = () => setShowAddTx(true);

  /** Render the active page based on `page` state */
  function renderPage() {
    switch (page) {
      case 'dashboard':
        return (
          <Dashboard
            wallets={wallets}
            transactions={transactions}
            budgets={budgets}
            setPage={setPage}
            onAddTx={onAddTx}
            categories={categories}
          />
        );
      case 'wallet':
        return (
          <WalletPage
            wallets={wallets}
            setWallets={apiSetWallets}
            transactions={transactions}
            setTransactions={apiSetTransactions}
            categories={categories}
            onCreateWallet={handleCreateWallet}
            onUpdateWallet={handleUpdateWallet}
            onDeleteWallet={handleDeleteWallet}
            onCreateTransaction={handleCreateTransaction}
          />
        );
      case 'tx':
        return (
          <TransactionsPage
            wallets={wallets}
            setWallets={apiSetWallets}
            transactions={transactions}
            setTransactions={apiSetTransactions}
            categories={categories}
            onCreateTransaction={handleCreateTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        );
      case 'budget':
        return (
          <BudgetPage
            budgets={budgets}
            setBudgets={handleSetBudgets}
            transactions={transactions}
            categories={categories}
            setCategories={apiSetCategories}
            cycleStart={cycleStart}
            setCycleStart={handleSetCycleStart}
            onCreateCategory={handleCreateCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        );
      case 'report':
        return (
          <ReportsPage
            transactions={transactions}
            budgets={budgets}
            wallets={wallets}
            cycleStart={cycleStart}
            setCycleStart={handleSetCycleStart}
            categories={categories}
          />
        );
      default:
        return (
          <Dashboard
            wallets={wallets}
            transactions={transactions}
            budgets={budgets}
            setPage={setPage}
            onAddTx={onAddTx}
            categories={categories}
          />
        );
    }
  }

  return (
    <ThemeProvider darkMode={darkMode} setDarkMode={handleSetDarkMode}>
      <Sidebar
        page={page}
        setPage={setPage}
        darkMode={darkMode}
        setDarkMode={handleSetDarkMode}
        user={user}
        onLogout={logout}
      />
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          background: 'var(--bg)',
        }}
      >
        {renderPage()}
      </main>

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: '#1E293B',
            color: '#F1F5F9',
            padding: '12px 20px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 9999,
            maxWidth: 360,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {toast}
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
      )}

      {/* Global Add Transaction modal */}
      {showAddTx && (
        <TxFormModal
          wallets={wallets}
          categories={categories}
          onClose={() => setShowAddTx(false)}
          onSave={async (data) => {
            try {
              await handleCreateTransaction(data);
              setShowAddTx(false);
            } catch {
              // Error already shown via toast
            }
          }}
        />
      )}
    </ThemeProvider>
  );
}

export default App;
