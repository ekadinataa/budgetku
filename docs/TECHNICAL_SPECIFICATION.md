# BudgetKu — Technical Specification Document

**Version:** 1.0  
**Last Updated:** July 2025  
**Status:** Active Development  

---

## 1. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React | 19.2.x |
| Build Tool | Vite (with Rolldown) | 8.x |
| Styling | CSS Modules + CSS Custom Properties | — |
| Charts | Recharts | 2.15.x |
| Backend | Firebase (Auth, Firestore, Hosting) | 12.12.x |
| Compression | fflate (for CSV ZIP export) | 0.8.x |
| Font | Plus Jakarta Sans | — |
| Testing | Vitest + Testing Library + fast-check | 4.x / 16.x / 4.x |
| Linting | ESLint | 9.x |
| Package Manager | npm | — |

### Key Technical Decisions
- **No backend server** — All logic runs client-side; Firebase provides auth and storage
- **No state management library** — State lifted to App.jsx, passed via props
- **No router library** — Page-based navigation via state variable
- **CSS Modules** — Scoped styles per component, no CSS-in-JS runtime
- **Vite 8 with Rolldown** — Fast builds with Rust-based bundler

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                       │
├─────────────────────────────────────────────────────────┤
│  React 19 SPA                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │  Pages   │  │Components│  │    App.jsx (State)    │  │
│  │          │←→│          │←→│  wallets, txs, ...    │  │
│  └──────────┘  └──────────┘  └───────────┬──────────┘  │
│                                           │              │
│  ┌──────────┐  ┌──────────┐  ┌───────────▼──────────┐  │
│  │  Utils   │  │  Hooks   │  │   Service Layer      │  │
│  │(pure fn) │  │          │  │  firestoreService.js  │  │
│  └──────────┘  └──────────┘  └───────────┬──────────┘  │
│                                           │              │
├───────────────────────────────────────────┼──────────────┤
│                                           ▼              │
│  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │   localStorage      │  │   Firebase Firestore    │  │
│  │  (local-only mode)  │  │    (authenticated)      │  │
│  └─────────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Core Principles
1. **Single Page Application** — No page reloads; navigation via state
2. **Lifted State** — All application state managed in App.jsx
3. **Dual Persistence** — Firestore (cloud) or localStorage (offline), transparently switched
4. **Pure Computation** — Business logic in utils/ as pure functions (testable, no side effects)
5. **Batch Writes** — Transaction + balance updates are atomic (Firestore batch)

---

## 3. Project Structure

```
budgetku/
├── src/
│   ├── App.jsx                    # Root component: state owner, routing, handlers
│   ├── App.css                    # Global styles, CSS custom properties, theme vars
│   ├── main.jsx                   # Entry point: React root + AuthProvider + ThemeProvider
│   ├── components/                # Reusable UI components
│   │   ├── Sidebar/               # Navigation sidebar + bottom nav + mobile menu
│   │   ├── DataMigrator.jsx       # localStorage → Firestore migration wizard
│   │   ├── charts/                # PieChart, CompareBarChart, DailyBarChart, MonthCompareBar
│   │   ├── icons/                 # NavIcon (SVG icon component)
│   │   └── ui/                    # Input, Select, ProgressBar, MultiChip, TxBadge, etc.
│   ├── pages/                     # Feature page components
│   │   ├── Auth/                  # LoginPage, RegisterPage, ForgotPasswordPage
│   │   ├── Dashboard/             # Dashboard, StatCard, Calendar, DebtWidget, InvestmentWidget
│   │   ├── Wallet/                # WalletPage, WalletFormModal
│   │   ├── Transactions/          # TransactionsPage, TxFormModal
│   │   ├── Budget/                # BudgetPage, IncomeModal, SectionEditModal, PeriodModal
│   │   ├── Recurring/             # RecurringPage, RecurringFormModal, RepurchaseModal
│   │   ├── Debt/                  # DebtPage, DebtFormModal, PaymentModal
│   │   ├── Investment/            # InvestmentPage, InvestmentFormModal, BuyModal, SellModal
│   │   ├── Reports/               # ReportsPage, CycleSettingModal
│   │   ├── Settings/              # SettingsPage, ResetConfirmModal, ImportConfirmModal
│   │   └── Fire/                  # FirePage (FIRE Calculator)
│   ├── services/                  # Data access layer
│   │   ├── firestoreService.js    # All Firestore CRUD operations
│   │   ├── validator.js           # Input validators (wallet, transaction, budget, category, preference)
│   │   ├── debtValidator.js       # Debt-specific validators
│   │   ├── investmentValidator.js # Investment-specific validators
│   │   ├── exportService.js       # JSON/CSV export builders
│   │   └── importService.js       # JSON/CSV import parsers and validators
│   ├── utils/                     # Pure helper functions
│   │   ├── formatters.js          # Currency (fmtFull, fmt), date (fmtDate), monthKey
│   │   ├── helpers.js             # Lookups, period range, filtering, wallet aggregates
│   │   ├── recurring.js           # Amortization, restock dates, grouping
│   │   ├── debtHelpers.js         # Annuity calc, amortization schedule, payment logic
│   │   ├── investmentHelpers.js   # Metrics, portfolio summary, deposito calc
│   │   ├── fireCalculator.js      # FIRE number, projections, recommendations
│   │   ├── periodAdjuster.js      # Salary date weekend/holiday adjustment
│   │   └── constants.js           # Storage keys, config constants
│   ├── context/                   # React context providers
│   │   ├── AuthContext.jsx        # Firebase Auth state + methods
│   │   └── ThemeContext.jsx       # Dark/light theme management
│   ├── data/                      # Static defaults
│   │   └── defaults.js            # Default wallets, transactions, budgets, categories
│   ├── config/                    # Configuration
│   │   └── firebase.js            # Firebase initialization (conditional)
│   └── hooks/                     # Custom React hooks
├── public/                        # Static assets
│   ├── favicon.svg
│   ├── logo.svg
│   └── icons.svg
├── dist/                          # Build output (deployed to Firebase Hosting)
├── functions/                     # Cloud Functions (currently unused by frontend)
│   └── src/                       # Express API routes (legacy/admin)
├── index.html                     # HTML entry point
├── package.json
├── vite.config.js
├── firebase.json                  # Firebase Hosting + Firestore config
├── firestore.rules                # Firestore security rules
├── .env                           # Environment variables (local)
├── .env.production                # Production environment variables
└── .firebaserc                    # Firebase project alias
```

---

## 4. Data Models (Firestore Schema)

All user data is stored under `users/{uid}/` with the following subcollections:

### 4.1 Wallets — `users/{uid}/wallets/{id}`

| Field | Type | Description |
|-------|------|-------------|
| name | string | Wallet display name |
| type | string | One of: `bank`, `ewallet`, `credit`, `paylater`, `cash` |
| balance | number | Current balance (can be negative for credit/paylater) |
| color | string | Hex color code (e.g., "#2563EB") |
| note | string | Optional note (e.g., last 4 digits) |

### 4.2 Transactions — `users/{uid}/transactions/{id}`

| Field | Type | Description |
|-------|------|-------------|
| date | string | ISO date "YYYY-MM-DD" |
| walletId | string | Reference to source wallet |
| type | string | One of: `income`, `expense`, `transfer` |
| categoryId | string \| null | Reference to category (null for transfers) |
| amount | number | Transaction amount (always positive) |
| note | string | Description/memo |
| tags | string[] | Array of tag strings |
| toWalletId | string \| null | Destination wallet (transfers only) |

### 4.3 Budgets — `users/{uid}/budgets/{monthKey}`

Document ID is the period key: `"YYYY-MM"` for months or `"range_YYYY-MM-DD_YYYY-MM-DD"` for custom ranges.

| Field | Type | Description |
|-------|------|-------------|
| totalIncome | number | Total income for the period |
| sections | object | Budget allocation by section |
| sections.needs | object | `{ total: number, cats: [{ id: string, amt: number }] }` |
| sections.wants | object | `{ total: number, cats: [{ id: string, amt: number }] }` |
| sections.savings | object | `{ total: number, cats: [{ id: string, amt: number }] }` |

### 4.4 Categories — `users/{uid}/categories/{id}`

| Field | Type | Description |
|-------|------|-------------|
| name | string | Category display name |
| section | string | One of: `needs`, `wants`, `savings`, `income` |
| color | string | Hex color code |

Note: Icon/emoji is derived from the category name at runtime (not stored).

### 4.5 Preferences — `users/{uid}/preferences/prefs`

Single document with user preferences:

| Field | Type | Description |
|-------|------|-------------|
| darkMode | boolean | Dark theme enabled |
| cycleStart | number | Billing cycle start day (1–28) |
| salaryAdjust | boolean | Adjust cycle start for weekends |
| page | string | Last active page |
| periodMode | string | Budget period mode: `month`, `cycle`, `range` |
| customRanges | array | Custom range definitions: `[{ id, start, end }]` |

### 4.6 FIRE Settings — `users/{uid}/preferences/fire`

| Field | Type | Description |
|-------|------|-------------|
| currentAge | number | User's current age |
| retirementAge | number | Target retirement age |
| monthlyIncome | number | Monthly income |
| monthlyExpenses | number | Monthly expenses |
| currentAssets | number | Current FIRE portfolio value |
| allocation | object | `{ pokok, hiburan, fire, emas }` — percentages |
| returnRate | number | Expected annual return (%) |
| salaryGrowth | number | Annual salary growth (%) |
| inflation | number | Inflation estimate (%) |
| postRetirementReturn | number | Post-retirement return (%) |

### 4.7 Recurring Items — `users/{uid}/recurringItems/{id}`

| Field | Type | Description |
|-------|------|-------------|
| name | string | Item name |
| categoryId | string | Reference to category |
| walletId | string | Default wallet for purchase |
| amount | number | Purchase price |
| durationDays | number | How long item lasts (days) |
| lastPurchaseDate | string | "YYYY-MM-DD" of last purchase |
| nextEstimateDate | string | "YYYY-MM-DD" estimated next purchase |
| isActive | boolean | Active/inactive status |
| note | string | Optional note |
| tags | string[] | Optional tags |
| createdAt | string | "YYYY-MM-DD" creation date |

### 4.8 Debts — `users/{uid}/debts/{id}`

| Field | Type | Description |
|-------|------|-------------|
| type | string | `utang` or `piutang` |
| personName | string | Person involved |
| totalAmount | number | Original principal amount |
| remainingAmount | number | Outstanding balance |
| walletId | string | Associated wallet |
| dueDate | string | Optional due date "YYYY-MM-DD" |
| description | string | Optional description |
| status | string | `active` or `settled` |
| payments | array | Payment history records |
| payments[].amount | number | Payment amount |
| payments[].principalPart | number | Principal portion of payment |
| payments[].interestPart | number | Interest portion of payment |
| payments[].date | string | Payment date |
| payments[].note | string | Payment note |
| payments[].walletId | string | Wallet used for payment |
| payments[].transactionId | string | Linked auto-generated transaction |
| transactionId | string | Transaction created on debt creation |
| createdAt | string | Creation date |
| interestEnabled | boolean | Annuity interest flag |
| interestRate | number | Annual interest rate (%) |
| tenorMonths | number | Loan term in months |
| startDate | string | Loan start date |
| monthlyInstallment | number | Calculated monthly payment |

### 4.9 Investments — `users/{uid}/investments/{id}`

| Field | Type | Description |
|-------|------|-------------|
| name | string | Investment name |
| assetType | string | One of: `deposito`, `saham`, `crypto`, `emas`, `reksadana`, `obligasi`, `p2p`, `lainnya` |
| notes | string | Optional notes |
| currentValue | number | Current market value |
| transactions | array | Buy/sell transaction history |
| transactions[].id | string | Unique transaction identifier |
| transactions[].type | string | `buy` or `sell` |
| transactions[].date | string | Transaction date |
| transactions[].units | number | Number of units |
| transactions[].pricePerUnit | number | Price per unit |
| transactions[].totalAmount | number | Total amount |
| transactions[].walletId | string | Wallet used |
| createdAt | string | Creation date |
| lastUpdated | string | Last update date |
| interestRate | number | Annual rate (deposito/P2P) |
| maturityDate | string | Maturity date (deposito/obligasi) |
| bankName | string | Bank name (deposito) |
| tickerSymbol | string | Stock ticker (saham) |
| coinName | string | Coin name (crypto) |
| fundName | string | Fund name (reksadana) |
| managerName | string | Manager name (reksadana) |
| unit | string | Unit description |

---

## 5. State Management

### 5.1 State Architecture

All application state lives in `App.jsx` as React `useState` hooks:

```javascript
// Core data
const [wallets, setWallets] = useState([]);
const [transactions, setTransactions] = useState([]);
const [budgets, setBudgets] = useState({});
const [categories, setCategories] = useState([]);
const [recurringItems, setRecurringItems] = useState([]);
const [debts, setDebts] = useState([]);
const [investments, setInvestments] = useState([]);
const [fireSettings, setFireSettings] = useState(DEFAULT_FIRE_SETTINGS);

// Preferences
const [page, setPage] = useState('dashboard');
const [darkMode, setDarkMode] = useState(false);
const [cycleStart, setCycleStart] = useState(1);
const [salaryAdjust, setSalaryAdjust] = useState(false);
const [periodMode, setPeriodMode] = useState('month');
const [customRanges, setCustomRanges] = useState([]);

// UI state
const [dataLoading, setDataLoading] = useState(false);
const [dataError, setDataError] = useState('');
const [toast, setToast] = useState('');
const [showAddTx, setShowAddTx] = useState(false);
```

### 5.2 Props Drilling Pattern

State is passed down to child components via props. Handler functions are defined in App.jsx and passed as callbacks:

```
App.jsx
├── Sidebar (page, setPage, darkMode, setDarkMode, user, onLogout, onAddTx)
├── Dashboard (wallets, transactions, budgets, categories, setPage, onAddTx, recurringItems, debts, investments)
├── WalletPage (wallets, onCreateWallet, onUpdateWallet, onDeleteWallet)
├── TransactionsPage (wallets, transactions, categories, onCreateTransaction, ...)
├── BudgetPage (budgets, setBudgets, transactions, categories, cycleStart, ...)
├── RecurringPage (recurringItems, categories, wallets, onCreateItem, ...)
├── DebtPage (debts, wallets, onCreateDebt, onUpdateDebt, onDeleteDebt, onRecordPayment)
├── InvestmentPage (investments, wallets, onCreateInvestment, onRecordBuy, onRecordSell, ...)
├── ReportsPage (transactions, budgets, wallets, cycleStart, categories, recurringItems)
├── SettingsPage (onResetData, wallets, transactions, budgets, categories, onImportData, ...)
└── FirePage (transactions, investments, setPage, onSaveFireSettings, fireSettings)
```

### 5.3 Handler Function Pattern

Each entity follows a consistent CRUD pattern:

```javascript
const handleCreate* = async (data) => {
  if (IS_LOCAL_MODE) {
    // Generate ID, add to local state
    return;
  }
  try {
    const created = await api.create*(data);
    setState(prev => [...prev, created]);
    // Refresh dependent data if needed (e.g., wallet balances after transaction)
  } catch (err) {
    showToast(err.message);
    throw err;
  }
};
```

### 5.4 localStorage Persistence (Local-Only Mode)

```javascript
useEffect(() => {
  if (!IS_LOCAL_MODE) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    page, wallets, transactions, budgets, categories,
    darkMode, cycleStart, salaryAdjust, periodMode,
    customRanges, recurringItems, debts, investments, fireSettings,
  }));
}, [/* all state dependencies */]);
```

---

## 6. Authentication Flow

### 6.1 Firebase Auth Configuration

```javascript
// src/config/firebase.js
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

let auth = null;
let db = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}
```

### 6.2 AuthContext Provider

```
                    ┌─────────────────┐
                    │  AuthProvider    │
                    │                 │
                    │  onAuthChanged  │──→ setUser(firebaseUser)
                    │  login()        │──→ signInWithEmailAndPassword
                    │  register()     │──→ createUserWithEmailAndPassword
                    │  logout()       │──→ signOut
                    │  resetPassword()│──→ sendPasswordResetEmail
                    │                 │
                    └─────────────────┘
```

### 6.3 IS_LOCAL_MODE Detection

```javascript
const IS_LOCAL_MODE = !firebaseAuth;
```

When `IS_LOCAL_MODE` is `true`:
- Auth pages are never shown
- All CRUD operations use local state directly
- localStorage persistence is active
- No network requests are made

### 6.4 Data Flow on Authentication

```
User logs in
    │
    ▼
Check localStorage for existing data
    │
    ├── Has data → Show DataMigrator (migrate? skip?)
    │                    │
    │                    ├── Migrate → batch write to Firestore → fetchAllData
    │                    └── Skip → fetchAllData
    │
    └── No data → fetchAllData
                       │
                       ▼
                  api.initUser() (creates defaults for new users)
                       │
                       ▼
                  Promise.all([
                    api.getWallets(),
                    api.getTransactions(),
                    api.getBudgets(),
                    api.getCategories(),
                    api.getPreferences(),
                    api.getRecurringItems(),
                    api.getDebts(),
                    api.getInvestments(),
                  ])
                       │
                       ▼
                  Populate all state
```

---

## 7. Service Layer

### 7.1 firestoreService.js

The service layer provides CRUD operations using the Firestore client SDK directly (no HTTP API):

#### Internal Helpers
- `getUid()` — Returns `auth.currentUser.uid` or throws
- `userCol(sub)` — Returns `collection(db, 'users', uid, sub)`
- `userDoc(sub, id)` — Returns `doc(db, 'users', uid, sub, id)`
- `getBalanceEffect(type, amount)` — Returns balance adjustment for transaction type

#### Batch Write Pattern (Transactions)
```javascript
// Creating a transaction atomically adjusts wallet balances
const batch = writeBatch(db);
batch.set(txRef, txData);                             // Create transaction
batch.update(walletRef, { balance: increment(±amount) }); // Adjust source wallet
if (type === 'transfer') {
  batch.update(toWalletRef, { balance: increment(amount) }); // Adjust dest wallet
}
await batch.commit();
```

#### Entity Operations

| Entity | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| Wallets | `createWallet(data)` | `getWallets()` | `updateWallet(id, data)` | `deleteWallet(id)` |
| Transactions | `createTransaction(data)` | `getTransactions(filters)` | `updateTransaction(id, data)` | `deleteTransaction(id)` |
| Budgets | — | `getBudgets()` | `updateBudget(monthKey, data)` | — |
| Categories | `createCategory(data)` | `getCategories()` | `updateCategory(id, data)` | `deleteCategory(id)` |
| Preferences | — | `getPreferences()` | `updatePreferences(data)` | — |
| Recurring | `createRecurringItem(data)` | `getRecurringItems()` | `updateRecurringItem(id, data)` | `deleteRecurringItem(id)` |
| Debts | `createDebt(data)` | `getDebts()` | `updateDebt(id, data)` | `deleteDebt(id)` |
| Investments | `createInvestment(data)` | `getInvestments()` | `updateInvestment(id, data)` | `deleteInvestment(id)` |

#### Special Operations
- `initUser()` — Creates default categories and preferences for new users (idempotent)
- `resetUserData()` — Deletes all user data across all subcollections, then re-initializes
- `migrateData(data)` — Batch-writes localStorage data to Firestore

### 7.2 Validators

Input validation before any write operation:

```javascript
// validator.js
validateWallet(data)       // name required, type valid, balance numeric
validateTransaction(data)  // date, walletId, type, amount required
validateBudget(data)       // totalIncome numeric, sections structure valid
validateCategory(data)     // name required, section valid
validatePreference(data)   // type checks on all preference fields
trimStrings(data)          // Recursively trim string values

// debtValidator.js
validateDebt(data)         // type, personName, totalAmount, walletId required
validatePayment(data, max) // amount > 0, amount <= remaining

// investmentValidator.js
validateInvestment(data)   // name, assetType required
validateInvestmentTransaction(data) // date, units, pricePerUnit, walletId required
validateCurrentValue(value) // numeric, non-negative
```

### 7.3 Import/Export Services

**Export (exportService.js):**
- `buildBudgetKuJson(data)` — Builds complete JSON backup with metadata
- `downloadJson(data)` — Triggers browser download of JSON file
- `downloadCsvZip(data)` — Generates CSV files, compresses with fflate, downloads ZIP

**Import (importService.js):**
- `parseAndValidate(jsonString)` — Parses JSON backup, validates structure
- `validateEntities(data)` — Deep validation of entity arrays
- `parseCsvZip(zipBytes)` — Extracts and parses CSV ZIP archive
- `parseTransactionCsv(csv, wallets, categories)` — Parses transaction CSV with wallet/category matching
- `parseWalletCsv(csv)` — Parses wallet CSV
- `parseBudgetCsv(csv, categories)` — Parses budget CSV with category matching
- `computeAppend(existingData, importData)` — Deduplication for append mode

---

## 8. Routing

### 8.1 Page-Based Navigation

Navigation is managed via a `page` state variable in App.jsx:

```javascript
const [page, setPage] = useState('dashboard');
```

### 8.2 renderPage() Switch

```javascript
function renderPage() {
  switch (page) {
    case 'dashboard': return <Dashboard ... />;
    case 'wallet':    return <WalletPage ... />;
    case 'tx':        return <TransactionsPage ... />;
    case 'budget':    return <BudgetPage ... />;
    case 'recurring': return <RecurringPage ... />;
    case 'debt':      return <DebtPage ... />;
    case 'invest':    return <InvestmentPage ... />;
    case 'report':    return <ReportsPage ... />;
    case 'settings':  return <SettingsPage ... />;
    case 'fire':      return <FirePage ... />;
    default:          return <Dashboard ... />;
  }
}
```

### 8.3 Page Identifiers

| Page ID | Component | Description |
|---------|-----------|-------------|
| `dashboard` | Dashboard | Main overview |
| `wallet` | WalletPage | Wallet management |
| `tx` | TransactionsPage | Transaction list + CRUD |
| `budget` | BudgetPage | Budget planning |
| `recurring` | RecurringPage | Recurring items management |
| `debt` | DebtPage | Debt/receivable management |
| `invest` | InvestmentPage | Investment portfolio |
| `report` | ReportsPage | Financial reports |
| `settings` | SettingsPage | App settings |
| `fire` | FirePage | FIRE calculator |

### 8.4 Auth Pages (Pre-authentication)

| Page | Component |
|------|-----------|
| `login` | LoginPage |
| `register` | RegisterPage |
| `forgot` | ForgotPasswordPage |

Managed by separate `authPage` state, rendered before main app shell.

---

## 9. Styling Architecture

### 9.1 CSS Custom Properties (Theme Variables)

Defined in `App.css` and switched via `data-theme` attribute:

```css
:root {
  /* Light theme (default) */
  --bg: #FAFBFC;
  --bg-2: #FFFFFF;
  --bg-3: #F1F5F9;
  --text-1: #0F172A;
  --text-2: #334155;
  --text-3: #475569;
  --text-4: #64748B;
  --text-5: #94A3B8;
  --text-6: #CBD5E1;
  --border: #E2E8F0;
  --border-2: #F1F5F9;
  --primary: #4F6EF7;
  --primary-hover: #3B5DE7;
  /* ... */
}

[data-theme="dark"] {
  --bg: #0F172A;
  --bg-2: #1E293B;
  --bg-3: #334155;
  --text-1: #F8FAFC;
  /* ... */
}
```

### 9.2 CSS Modules

Each component has a co-located `.module.css` file:

```
pages/Dashboard/
├── Dashboard.jsx
├── Dashboard.module.css
├── StatCard.jsx
└── Calendar.jsx
```

Usage pattern:
```jsx
import styles from './Dashboard.module.css';
// ...
<div className={styles.wrapper}>
```

### 9.3 Dark/Light Theme Toggle

```jsx
// ThemeContext applies data-theme to document
useEffect(() => {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
}, [darkMode]);
```

### 9.4 Responsive Breakpoint

Primary breakpoint at **768px**:

```css
/* Desktop: sidebar layout */
@media (min-width: 769px) {
  .sidebar { display: flex; }
  .bottomNav { display: none; }
  .mobileTopBar { display: none; }
  .heroCard { display: none; }
  .quickMenu { display: none; }
}

/* Mobile: bottom nav layout */
@media (max-width: 768px) {
  .sidebar { display: none; }
  .bottomNav { display: flex; }
  .mobileTopBar { display: flex; }
  .heroCard { display: block; }
  .quickMenu { display: block; }
}
```

### 9.5 Mobile-Specific UI Elements
- Bottom navigation bar with FAB (floating action button)
- Top bar with logo and user avatar/menu
- Hero card (summary card with gradient background)
- Quick menu grid (shortcut navigation)
- Full-screen modals (no overlay modals on mobile)

---

## 10. Key Algorithms

### 10.1 Annuity Calculation (`calcAnnuityInstallment`)

Standard annuity formula for fixed-rate loan installments:

```
M = P × [r(1+r)^n] / [(1+r)^n - 1]

Where:
  M = Monthly installment
  P = Principal (loan amount)
  r = Monthly interest rate (annualRate / 100 / 12)
  n = Number of months (tenor)
```

```javascript
export function calcAnnuityInstallment(principal, annualRate, tenorMonths) {
  if (tenorMonths <= 0 || principal <= 0) return 0;
  if (annualRate <= 0) return Math.round(principal / tenorMonths);
  const r = annualRate / 100 / 12;
  const n = tenorMonths;
  const factor = Math.pow(1 + r, n);
  return Math.round(principal * (r * factor) / (factor - 1));
}
```

### 10.2 Amortized Monthly Cost (`getAmortizedMonthlyCost`)

Spreads a one-time purchase cost over its usage duration:

```
monthlyCost = (purchasePrice / durationInDays) × 30
```

```javascript
export function getAmortizedMonthlyCost(amount, durationDays) {
  if (!durationDays || durationDays <= 0) return 0;
  return (amount / durationDays) * 30;
}
```

### 10.3 FIRE Number (4% Rule + Inflation)

```
baseFireNumber = monthlyExpenses × 12 × 25
inflationAdjusted = baseFireNumber × (1 + inflation/100)^yearsToRetirement
```

The 4% rule states you can safely withdraw 4% of your portfolio annually (25× annual expenses).

### 10.4 Portfolio Projection (Compound Growth)

Three-scenario projection with annual compounding:

```javascript
// For each year i:
annualSavings = baseAnnualSavings × (1 + salaryGrowth)^i

valOptimis = valOptimis × (1 + returnRate + 0.02) + annualSavings
valModerat = valModerat × (1 + returnRate) + annualSavings
valPesimis = valPesimis × (1 + returnRate - 0.02) + annualSavings
```

### 10.5 Billing Cycle Date Ranges (`getPeriodRange`)

```javascript
// Standard month: cycleStart = 1
// range = { start: "YYYY-MM-01", end: "YYYY-MM-{lastDay}" }

// Custom cycle: cycleStart = 25, for April 2026
// range = { start: "2026-03-25", end: "2026-04-24" }

// With salary adjustment: shifts start to nearest preceding business day
// If Mar 25 is Saturday → adjusts to Mar 24 (Friday)
```

### 10.6 Salary Date Adjustment (`adjustCycleStart`)

Shifts a target date backward to the nearest preceding weekday:

```javascript
// If targetDate falls on:
//   Saturday → shift to Friday (day - 1)
//   Sunday → shift to Friday (day - 2)
//   Weekday → no change
```

### 10.7 Deposito Interest Calculation

Simple interest accrual based on elapsed days:

```
currentValue = principal + principal × (annualRate/100) × (daysSinceDeposit/365)
```

### 10.8 Investment Average Buy Price

Weighted average cost basis with FIFO-like reduction on sells:

```javascript
for each transaction:
  if BUY:  totalUnits += units; totalCost += units × price
  if SELL: avgAtSell = totalCost / totalUnits
           totalCost -= avgAtSell × sellUnits
           totalUnits -= sellUnits

avgBuyPrice = totalCost / totalUnits
```

---

## 11. Deployment

### 11.1 Build Process

```bash
# Install dependencies
npm install

# Development server (Vite HMR)
npm run dev

# Production build
npm run build
# Output: dist/

# Preview production build locally
npm run preview
```

### 11.2 Firebase Hosting

```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

### 11.3 Hosting Configuration (`firebase.json`)

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ],
    "headers": [
      {
        "source": "/assets/**",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
        ]
      }
    ]
  }
}
```

### 11.4 Production URL

**https://budgetku-app-v1.web.app**

### 11.5 Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Deny all access by default
    match /{document=**} {
      allow read, write: if false;
    }
    // Per-user data isolation
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 11.6 Environment Variables

```bash
# .env (local development)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...

# .env.production (production build)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

---

## 12. Performance Considerations

### 12.1 Client-Side Computation
- All calculations (annuity, amortization, FIRE projections, budget aggregation) run in the browser
- No server round-trips for computed values
- `useMemo` hooks for expensive computations (projections, filtered lists, summaries)

### 12.2 Debounced Persistence
- Preferences auto-saved with **300ms debounce** to batch rapid state changes
- FIRE settings auto-saved with **500ms debounce**
- Prevents excessive Firestore writes during user interaction

### 12.3 Lazy Data Fetch
- All data fetched in parallel on authentication (`Promise.all`)
- No incremental loading — entire dataset loaded upfront
- Trade-off: simple architecture, acceptable for personal finance data volumes

### 12.4 Asset Optimization
- SVG for all icons and logos (vector, small file size)
- Vite code splitting for production builds
- Immutable cache headers for hashed assets (`/assets/**`)
- SPA rewrite rule for client-side routing

### 12.5 Bundle Considerations
- React 19 (tree-shaking enabled)
- Recharts loaded for chart-heavy pages
- fflate for ZIP operations (small library)
- Firebase SDK (modular imports — only auth + firestore)

---

## 13. Security

### 13.1 Authentication
- Firebase Authentication (email/password)
- Session managed by Firebase SDK (ID tokens auto-refreshed)
- No custom token management or storage

### 13.2 User Data Isolation
- Firestore security rules enforce that users can only access their own data
- All data paths under `users/{userId}/` — rule checks `request.auth.uid == userId`
- Default deny on all other paths

### 13.3 Environment Variables
- Firebase API keys stored in `.env` files (not committed to git via `.gitignore`)
- `VITE_` prefix makes them available in client code (standard Vite behavior)
- API keys are safe to expose client-side (Firestore rules enforce access control)

### 13.4 Input Validation
- All form inputs validated before write operations
- Server-side validation via Firestore security rules (structure not currently enforced beyond auth)
- Client-side validators:
  - String trimming and length limits
  - Numeric type coercion
  - Required field checks
  - Enum validation (wallet types, transaction types, sections)
  - Date format validation

### 13.5 Data Export Security
- Exports download to user's local device only
- No data sent to third-party servers
- Import validates structure and types before writing

### 13.6 Local Storage
- Data stored in cleartext in localStorage (standard browser behavior)
- Accessible only to same-origin pages
- Cleared on browser data wipe or explicit app reset

---

## Appendix A: Cloud Functions (Legacy)

The `functions/` directory contains an Express-based API that was used during early development. It is **not currently used** by the frontend (which communicates directly with Firestore via the client SDK). The functions include:

- Health check endpoint
- CRUD routes for wallets, transactions, budgets, categories, preferences
- Auth guard middleware
- Rate limiter
- Input validator
- Request logger

These may be used in the future for admin operations or scheduled tasks.

---

## Appendix B: Testing Strategy

| Layer | Tool | Scope |
|-------|------|-------|
| Unit Tests | Vitest | Pure utility functions (formatters, helpers, calculators) |
| Component Tests | Vitest + Testing Library | UI components (Sidebar, theme context) |
| Property-Based Tests | fast-check | Edge cases in calculation functions |
| Integration Tests | Vitest | Firebase config validation |

Test command:
```bash
npm run test        # Single run
npm run test:watch  # Watch mode
```

---

## Appendix C: Data Flow Diagrams

### Transaction Creation Flow

```
User fills TxFormModal
        │
        ▼
handleCreateTransaction(data)
        │
        ├── IS_LOCAL_MODE?
        │       │
        │       ├── Yes: generate ID, add to state, done
        │       │
        │       └── No: api.createTransaction(data)
        │                   │
        │                   ▼
        │           writeBatch:
        │             1. Create transaction doc
        │             2. Increment source wallet balance
        │             3. (If transfer) Increment dest wallet balance
        │                   │
        │                   ▼
        │           Update local state (transactions + wallets)
        │
        └── showToast on error
```

### Debt Payment Flow

```
User clicks "Bayar" on DebtCard
        │
        ▼
PaymentModal opens (amount, date, wallet, note)
        │
        ▼
handleRecordPayment(debtId, paymentData)
        │
        ├── Validate payment
        │
        ├── Build transaction data (buildDebtTransaction)
        │       utang payment → expense
        │       piutang payment → income
        │
        ├── handleCreateTransaction(txData)
        │       (wallet balance updated atomically)
        │
        ├── Calculate new remaining (only principal reduces balance)
        │
        ├── Build payment entry with breakdown
        │
        ├── Update debt record:
        │       remainingAmount, payments[], status
        │
        └── If remaining ≤ 0 → status = 'settled'
```
