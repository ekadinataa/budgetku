# BudgetKu — Functional Specification Document

**Version:** 1.0  
**Last Updated:** July 2025  
**Status:** Active Development  

---

## 1. Executive Summary

BudgetKu is a comprehensive personal finance management web application designed specifically for Indonesian users. It provides tools for expense tracking, budget planning, debt management, investment portfolio tracking, and long-term financial planning (FIRE — Financial Independence, Retire Early).

### Target Users
- Indonesian millennials and Gen-Z professionals managing personal finances
- Users who want a simple yet powerful budgeting tool in their native language
- Individuals planning for financial independence

### Problems Solved
- Fragmented financial tracking across multiple apps and spreadsheets
- Lack of Indonesian-language personal finance tools with comprehensive features
- No integrated view of budgets, debts, investments, and recurring expenses
- Difficulty planning for long-term financial goals (FIRE)

---

## 2. Product Overview

| Attribute | Detail |
|-----------|--------|
| Product Name | BudgetKu — Money Tracker |
| Platform | Web application (responsive — desktop + mobile) |
| Deployment URL | https://budgetku-app-v1.web.app |
| Language | Indonesian (Bahasa Indonesia) throughout |
| Auth Modes | Firebase Authentication (email/password) or local-only (no account required) |

BudgetKu operates as a client-side Single Page Application with optional cloud persistence. Users can use the app without creating an account (data stored in localStorage) or authenticate to sync data across devices via Firebase Firestore.

---

## 3. User Roles

### 3.1 Authenticated User
- Full access to all features
- Data persisted to Firebase Firestore (cloud-synced)
- Login, register, and password reset capabilities
- Data migration from local storage to cloud on first authentication

### 3.2 Local-Only User
- Full access to all features (identical functionality)
- Data persisted to browser localStorage only
- No account creation required
- Data is device-specific and not synced

The application automatically detects whether Firebase is configured. If not, it runs in local-only mode transparently.

---

## 4. Feature Modules

### 4.1 Authentication

#### 4.1.1 Login
- Email and password authentication via Firebase Auth
- Error messages displayed for invalid credentials
- Navigation to Register and Forgot Password pages

#### 4.1.2 Register
- New account creation with email and password
- Auto-initialization of default categories and preferences on first login
- Navigation back to Login page

#### 4.1.3 Forgot Password
- Password reset email sent via Firebase Auth
- Confirmation message displayed after sending

#### 4.1.4 Local-Only Mode
- Triggered automatically when Firebase environment variables are not configured
- No authentication UI shown
- All data operations use localStorage directly
- Full feature parity with authenticated mode

#### 4.1.5 Data Migration
- On first authentication, if localStorage contains existing data, a migration prompt appears
- User can choose to migrate local data to Firestore or skip
- After migration, local storage data is preserved as backup

---

### 4.2 Dashboard

The Dashboard is the primary landing page providing a comprehensive financial overview.

#### 4.2.1 Personalized Greeting
- Time-of-day-based greeting in Indonesian:
  - Before 11:00 → "Selamat Pagi 👋"
  - 11:00–15:00 → "Selamat Siang ☀️"
  - 15:00–18:00 → "Selamat Sore 🌅"
  - After 18:00 → "Selamat Malam 🌙"
- Displays username (extracted from email before @)

#### 4.2.2 Hero Card (Mobile)
- Shows total saldo (balance across all wallets)
- Current month label
- Two sub-cards: Pemasukan (income) and Pengeluaran (expense) for the month
- Abbreviated currency format (e.g., "1,5jt" for Rp1.500.000)

#### 4.2.3 Quick Menu (Mobile)
- Grid of shortcut buttons for quick navigation:
  - Budget, Berkala (Recurring), Utang (Debt), Investasi, Dompet (Wallet), Laporan (Report), FIRE
- Each with a colored icon and label

#### 4.2.4 Smart Insight Card
- Automatically computed insight based on current month data
- Example: "Pengeluaran terbesarmu bulan ini: Makanan & Minum (Rp1.500.000)"
- Shows emoji icon and descriptive text

#### 4.2.5 Stat Cards
Four key metrics displayed in a grid:
1. **Budget Hari Ini** — Daily budget (monthly income ÷ days in month), amount spent today, remaining
2. **Pemasukan Bulan Ini** — Total income this month
3. **Pengeluaran Bulan Ini** — Total expenses this month with percentage of income
4. **Total Saldo** — Sum of all wallet balances with wallet count

#### 4.2.6 Budget Summary
- Per-section (Kebutuhan/Keinginan/Tabungan) progress bars
- Shows spent vs allocated amounts
- Overflow indicator when spending exceeds budget
- "Lihat Detail" link to Budget page

#### 4.2.7 Calendar Widget
- Monthly calendar view
- Transaction dots on dates that have transactions
- Color-coded by transaction type (income/expense)
- Navigate between months

#### 4.2.8 Wallet Summary
- Shows up to 4 wallets with name, type, icon, and balance
- Color-coded wallet icons
- Abbreviated balance format
- "Lihat Semua" link to Wallet page

#### 4.2.9 Restock Reminder Widget
- Displays recurring items that need restocking within 7 days
- Shows item name, category, and urgency status
- Color-coded badges: "Terlambat" (red) or "Segera" (yellow)
- "Lihat Semua" link to Recurring page
- Only visible when there are items needing restock

#### 4.2.10 Debt Due Date Widget
- Shows upcoming debt payments and overdue debts
- Displays person name, amount, and due date status
- Links to Debt page

#### 4.2.11 Investment Portfolio Widget
- Summarizes total portfolio value and performance
- Shows profit/loss with percentage return
- Links to Investment page

#### 4.2.12 Recent Transactions
- Last 6 non-transfer transactions
- Each shows: emoji icon (from category), note, date, category name, and amount
- Color-coded amount: green for income, red for expense
- "Lihat Semua" link to Transactions page

---

### 4.3 Wallet Management

#### 4.3.1 Wallet Types
- **Bank** — Traditional bank accounts
- **E-Wallet** — Digital wallets (GoPay, OVO, DANA, etc.)
- **Kartu Kredit** — Credit cards
- **PayLater** — Buy-now-pay-later services (Kredivo, etc.)
- **Tunai/Cash** — Physical cash

#### 4.3.2 Wallet Properties
- Name (required)
- Type (required — one of the 5 types above)
- Balance (numeric, can be negative for credit/PayLater)
- Color (for visual identification)
- Note (optional — e.g., last 4 digits of account number)

#### 4.3.3 Operations
- **Create** — Add new wallet with initial balance
- **Update** — Edit wallet name, type, color, note, and manually adjust balance
- **Delete** — Remove wallet (no cascade delete of transactions)
- **Auto-balance update** — Wallet balances automatically adjust when transactions are created, updated, or deleted

#### 4.3.4 Display
- List view with wallet icon, name, type label, and balance
- Aggregate summary: total assets, total debt, net balance
- Color-coded balances (red for negative)

---

### 4.4 Transactions

#### 4.4.1 Transaction Types
- **Income (Pemasukan)** — Money received; increases wallet balance
- **Expense (Pengeluaran)** — Money spent; decreases wallet balance
- **Transfer** — Money moved between wallets; decreases source, increases destination

#### 4.4.2 Transaction Properties
- Date (YYYY-MM-DD format)
- Wallet (source wallet)
- Type (income/expense/transfer)
- Category (assigned from user's category list; filtered by type)
- Amount (numeric, positive)
- Note (free-text description)
- Tags (array of strings for flexible labeling)
- To Wallet (destination wallet — only for transfers)

#### 4.4.3 Category Assignment
- Categories filtered by transaction type:
  - Income → shows only "income" section categories
  - Expense → shows only "needs", "wants", "savings" section categories
  - Transfer → no category required
- Each category has an emoji icon for visual identification

#### 4.4.4 Quick Amount Buttons
- Pre-set amount buttons for fast entry: 10rb, 20rb, 25rb, 50rb, 100rb, 200rb, 500rb
- Tapping sets the amount field instantly

#### 4.4.5 Filtering
Multi-filter support with chip-based selection:
- **Wallet** — Filter by one or more wallets
- **Type** — Filter by income, expense, transfer
- **Category** — Filter by one or more categories
- **Tags** — Filter by one or more tags
- **Date Range** — Three modes:
  - "Per Bulan" — Select specific month
  - "Custom Range" — Start and end date pickers
  - "Semua Waktu" — No date filter
- **Search** — Free-text search within transaction notes

#### 4.4.6 Display
- Grouped by date (descending)
- Date headers with daily income/expense totals
- Each row: category emoji, note, badges (type, category name, wallet), amount
- Expandable action buttons (edit, delete) on row tap
- Summary bar: total income, total expense, net for filtered set

#### 4.4.7 Auto Wallet Balance Adjustment
- Creating a transaction: adjusts source wallet balance (and destination for transfers)
- Updating a transaction: reverses old effect, applies new effect
- Deleting a transaction: reverses the balance effect
- All adjustments use atomic batch writes (Firestore mode)

---

### 4.5 Budget Planning

#### 4.5.1 Overview
Monthly income allocation using the 50/30/20 rule as guidance:
- **Kebutuhan (Needs)** — 50% guideline
- **Keinginan (Wants)** — 30% guideline
- **Tabungan (Savings)** — 20% guideline

#### 4.5.2 Period Modes
Three configurable period modes:
1. **Per Bulan** — Standard calendar month (1st to last day)
2. **Custom Siklus** — Billing cycle based on salary date (e.g., 25th to 24th)
   - Configurable cycle start day (1–28)
   - Optional salary date adjustment (shifts to nearest preceding weekday)
3. **Custom Rentang** — User-defined start and end dates
   - Create arbitrary date ranges for budget periods
   - Period transition prompts when a range expires
   - Option to copy budget allocation from previous period

#### 4.5.3 Income Configuration
- Set total monthly income for the period
- Serves as the basis for section allocation percentages

#### 4.5.4 Section Allocation
- Each section (Kebutuhan/Keinginan/Tabungan) has a total allocation
- Per-category budget amounts within each section
- Distribution visualization bar showing allocation percentages
- Warning when total allocation exceeds income
- "Belum Dialokasikan" indicator for unallocated funds

#### 4.5.5 Budget Tracking
- Per-section progress bars (spent vs allocated)
- Per-category progress bars
- Overflow indicators when spending exceeds allocation
- "OVER" badges on categories exceeding their budget
- Percentage-based color coding (green < 80%, yellow 80-100%, red > 100%)

#### 4.5.6 Salary Date Adjustment
- When enabled and cycle start > 1, adjusts the cycle start date to the nearest preceding business day
- Accounts for weekends (Saturday/Sunday)
- Aligns budget periods with actual salary receipt dates

#### 4.5.7 Recurring Items Integration
- Displays amortized monthly cost of recurring items per section
- Shows total periodic cost as a separate card
- Helps users understand their "true" monthly costs beyond visible transactions

---

### 4.6 Recurring Items (Barang Berkala)

#### 4.6.1 Purpose
Track items purchased on a periodic schedule (skincare, shampoo, toiletries, supplements, etc.) and calculate their true monthly cost through amortization.

#### 4.6.2 Item Properties
- Name (required)
- Category (links to expense categories)
- Wallet (default wallet for purchases)
- Amount/Price (purchase price)
- Duration in days (how long the item lasts)
- Last purchase date
- Next estimated purchase date (auto-calculated)
- Note (optional)
- Tags (optional array)
- Active/Inactive status
- Created date

#### 4.6.3 Duration Shortcuts
Quick-set buttons for common durations:
- 2 minggu (14 days)
- 1 bulan (30 days)
- 1.5 bulan (45 days)
- 2 bulan (60 days)
- 3 bulan (90 days)
- 6 bulan (180 days)
- 1 tahun (365 days)

#### 4.6.4 Amortized Monthly Cost
- Formula: `(amount / durationDays) × 30`
- Represents the daily cost spread over a 30-day month
- Aggregated by category and by budget section
- Displayed in Budget page and Reports page

#### 4.6.5 Restock Reminder
- Items are flagged when their next estimated purchase date is within 7 days
- Grouped into three status categories:
  - 🔴 **Perlu Restock** — Within 7 days or overdue
  - ✅ **Masih Tersedia** — More than 7 days remaining
  - ⏸️ **Non-aktif** — Deactivated items
- Status displayed in both Recurring page and Dashboard widget

#### 4.6.6 Repurchase Flow
- "Sudah Beli" button triggers repurchase modal
- Captures: purchase date, new price (can be updated), wallet selection
- Option to auto-create expense transaction
- Updates item's lastPurchaseDate and recalculates nextEstimateDate
- Transaction auto-tagged with "berkala"

#### 4.6.7 Active/Inactive Grouping
- Items can be toggled between active and inactive status
- Inactive items are excluded from amortization calculations
- Inactive items are hidden from restock reminders

---

### 4.7 Debt Management (Utang/Piutang)

#### 4.7.1 Debt Types
- **Utang** — Money you owe (borrowed from someone)
- **Piutang** — Money owed to you (lent to someone)

#### 4.7.2 Debt Properties
- Type (utang/piutang)
- Person name (who you owe / who owes you)
- Total amount (original principal)
- Remaining amount (outstanding balance)
- Wallet (associated wallet for payments)
- Due date (optional)
- Description (optional)
- Status (active/settled)
- Payment history (array of payment records)
- Transaction ID (linked auto-generated transaction)
- Interest fields (for annuity debts):
  - Interest enabled flag
  - Annual interest rate (percentage)
  - Tenor in months
  - Start date
  - Monthly installment amount

#### 4.7.3 Annuity Interest Support (Bunga Anuitas)
- Enable interest calculation for debts with fixed-rate loans
- Auto-calculates monthly installment using standard annuity formula:
  `M = P × [r(1+r)^n] / [(1+r)^n - 1]`
- Generates full amortization schedule showing:
  - Month number
  - Principal portion
  - Interest portion
  - Total payment
  - Remaining principal
- Schedule displayed as expandable table in debt card
- Marks paid installments with checkmark

#### 4.7.4 Auto-Transaction Generation
- **Creating a debt:**
  - Utang → creates income transaction (money received)
  - Piutang → creates expense transaction (money lent out)
- **Recording a payment:**
  - Utang → creates expense transaction (money paid back)
  - Piutang → creates income transaction (money received back)
- All auto-transactions tagged with "utang-piutang"

#### 4.7.5 Partial Payments (Cicilan)
- Record partial payments against a debt
- Payment history tracked with date, amount, note, and linked transaction
- For annuity debts: payment split into principal and interest portions
- Only principal portion reduces remaining balance
- Debt auto-marked as "settled" when remaining reaches 0

#### 4.7.6 Due Date Tracking
- Optional due date per debt record
- Days-until-due calculation
- Overdue detection (red badge when past due)
- Dashboard widget shows upcoming and overdue debts

#### 4.7.7 Summary
Three key metrics on the Debt page:
- **Total Utang** — Sum of remaining amounts for active utang records
- **Total Piutang** — Sum of remaining amounts for active piutang records
- **Posisi Bersih** — Net position (piutang − utang)

#### 4.7.8 Filtering
- Semua (All)
- Utang only
- Piutang only
- Active only
- Settled (Lunas) only

---

### 4.8 Investment Portfolio

#### 4.8.1 Asset Types (8 types)
1. **Deposito** — Fixed deposits with interest rate and maturity date
2. **Saham** — Stocks/equities
3. **Crypto** — Cryptocurrency
4. **Emas** — Gold/precious metals
5. **Reksadana** — Mutual funds
6. **Obligasi** — Bonds
7. **P2P Lending** — Peer-to-peer lending
8. **Lainnya** — Other investments

#### 4.8.2 Investment Properties
- Name (required)
- Asset type (required)
- Notes (optional)
- Current value (manually updated or auto-calculated for deposito)
- Transaction history (buy/sell records)
- Type-specific fields:
  - Interest rate (deposito, P2P)
  - Maturity date (deposito, obligasi)
  - Bank name (deposito)
  - Ticker symbol (saham)
  - Coin name (crypto)
  - Fund name (reksadana)
  - Manager name (reksadana)
  - Unit (generic)

#### 4.8.3 Buy/Sell Tracking
- **Buy** — Records purchase with: date, units, price per unit, total amount, wallet
  - Creates expense transaction from selected wallet
  - Tagged with "investasi"
- **Sell** — Records sale with: date, units, price per unit, total amount, wallet
  - Creates income transaction to selected wallet
  - Tagged with "investasi"
- Transaction history viewable per investment

#### 4.8.4 Current Value Update
- Manual update for most asset types
- Auto-calculated for Deposito (accrued interest based on days since deposit)
- Deposito formula: `principal + principal × (rate/100) × (days/365)`

#### 4.8.5 Profit/Loss Calculation
Per investment:
- **Cost Basis** — Total units × weighted average buy price
- **Current Value** — Latest value (manual or auto-calculated)
- **Unrealized Gain** — Current value − Cost basis
- **Return %** — (Unrealized gain / Cost basis) × 100

Portfolio-wide:
- Total value, total cost basis, total unrealized gain, total return %

#### 4.8.6 Deposito Features
- Auto interest calculation based on deposit date and annual rate
- Maturity date tracking with days-until-maturity display
- Projected return at maturity calculation
- "Jatuh Tempo" badge when matured

#### 4.8.7 Portfolio Summary
- Summary cards: Total Value, Total Cost Basis, Profit/Loss, Return %
- Allocation by asset type
- Filter by asset type

---

### 4.9 FIRE Calculator

#### 4.9.1 Purpose
Financial Independence, Retire Early planning tool that projects portfolio growth and retirement sustainability.

#### 4.9.2 FI Readiness Score
- Score from 0% to 100%
- Formula: `(currentAssets / inflationAdjustedFireNumber) × 100`
- Color-coded: Red (<25%), Yellow (25-50%), Amber (50-75%), Green (>75%)
- Progress bar visualization
- Congratulations message at 100%

#### 4.9.3 FIRE Number Calculation
- Base FIRE Number: `monthlyExpenses × 12 × 25` (4% rule)
- Inflation-adjusted: `baseFireNumber × (1 + inflation/100)^yearsToRetirement`
- Displays both current and retirement-adjusted values

#### 4.9.4 Financial Data Inputs
- Current age (15–80)
- Target retirement age
- Monthly income
- Monthly expenses
- Current FIRE assets
- Validation: age range, retirement > current age, income > 0, expenses < income warning

#### 4.9.5 Income Allocation Configuration
Four allocation buckets:
- Pokok (Basic needs)
- Hiburan (Entertainment)
- FIRE (Investment for FI)
- Emas (Gold/precious metals)

Must total 100%. Displays nominal amounts and warns on over/under allocation.

#### 4.9.6 Market Assumptions (Sliders)
- Pre-retirement investment return (1–20%)
- Annual salary growth (0–15%)
- Inflation estimate (1–12%)
- Post-retirement conservative return (1–12%)

#### 4.9.7 Projection Chart
- Line chart showing portfolio growth over time
- Three scenarios: Optimis (+2% return), Moderat (base), Pesimis (-2% return)
- Reference line at inflation-adjusted FIRE Number
- X-axis: Age, Y-axis: Portfolio value

#### 4.9.8 Results Tabs

**Saran (Recommendations)**
- Personalized advice based on:
  - Savings rate (warning if <20%, success if ≥40%)
  - Expense ratio (warning if >50% of income)
  - Readiness score milestones
  - Emergency fund check (6 months expenses)
  - Time horizon considerations

**Akumulasi (Accumulation Table)**
- Year-by-year breakdown showing:
  - Year, Age, Annual savings, Portfolio value, Growth percentage

**Pensiun (Retirement Sustainability)**
- How many years the portfolio lasts after retirement
- Year-by-year: withdrawal, remaining balance, investment return
- Accounts for inflation on expenses and conservative returns

#### 4.9.9 Auto-Fill from App Data
- "Auto" buttons to populate from actual transaction data:
  - Monthly income: average of last 3 months' income transactions
  - Monthly expenses: average of last 3 months' expense transactions
  - Current assets: sum of all investment portfolio values

#### 4.9.10 Settings Persistence
- All FIRE settings auto-saved with 500ms debounce
- Stored in Firestore at `users/{uid}/preferences/fire`
- Restored on page load

---

### 4.10 Reports

#### 4.10.1 Period Selection
- Month dropdown (auto-populated from transaction dates)
- Cycle date configuration (adjustable via modal)

#### 4.10.2 Cashflow Summary
Three metric cards:
- Total Pemasukan (Income) — green
- Total Pengeluaran (Expense) — red, with % change vs previous month
- Net Cashflow — blue/red based on positive/negative

#### 4.10.3 Category Pie Chart
- Visual breakdown of expenses by category
- Shows top 6 categories with color-coded legend
- Displays amount and percentage per category

#### 4.10.4 Income vs Expense Comparison
- Bar chart comparing income and expense
- Previous month comparison bar
- Month-over-month comparison with current vs previous period

#### 4.10.5 Daily Expense Bar Chart
- Bar for each day of the billing cycle period
- Shows daily expense totals
- Helps identify spending patterns

#### 4.10.6 Budget Performance
Per-section (Kebutuhan/Keinginan/Tabungan):
- Section header with spent/allocated and percentage
- Progress bar with overflow indicator
- Per-category rows with individual progress bars
- "OVER" badge for categories exceeding budget
- "Melebihi!" warning for sections over budget

#### 4.10.7 Recurring Items Amortized Analysis
- Shows amortized monthly cost breakdown by section
- Total amortized cost per month
- Per-category breakdown with amounts
- Comparison: actual spending vs amortized periodic costs
- "True monthly cost" calculation (actual + unaccounted periodic costs)

#### 4.10.8 Cycle Date Configuration
- Modal to change billing cycle start date (1–28)
- Immediately updates period calculations across the Reports page

---

### 4.11 Settings

#### 4.11.1 FIRE Calculator Access
- Quick link button to FIRE Calculator page (🔥 Kalkulator FIRE)

#### 4.11.2 Data Export
- **JSON format** — Complete BudgetKu backup file
- **CSV format** — ZIP archive containing separate CSV files for wallets, transactions, budgets
- Downloads to user's device

#### 4.11.3 Data Import
**Backup Restore (JSON/ZIP):**
- Upload BudgetKu JSON backup or CSV ZIP
- Preview import summary (wallet count, transaction count, budget periods, categories)
- Choose mode: Replace (overwrite all) or Append (add new, skip existing)
- Validation before import

**Multi-file CSV Import:**
- Separate file slots for: Transactions, Budget, Wallets
- Format examples provided with toggle:
  - Transactions: `Tanggal,Tipe,Jumlah,Kategori,Sub Kategori,Dompet,Ke Dompet,Catatan`
  - Budget: `Periode,Total Pemasukan,Bagian,Kategori,Alokasi`
  - Wallet: `Nama,Tipe,Saldo,Catatan`
- Per-slot file selection with row count preview
- Deduplication: skips wallets that already exist by name
- Auto-creates new categories found in import data

#### 4.11.4 Data Reset
- Confirmation modal with text-based verification ("RESET")
- Deletes all user data (wallets, transactions, budgets, categories, preferences, recurring items, debts, investments)
- Re-initializes default categories and preferences after reset

#### 4.11.5 Category Management
- Grouped by section (Kebutuhan, Keinginan, Tabungan, Pemasukan)
- Collapsible sections with count
- Per-category operations:
  - **Edit** — Change name and color
  - **Delete** — Only if not used in transactions or budget allocations (shows error message if in use)
  - **Add** — Create new category in any section with name and color picker
- Color palette with 20 predefined colors

#### 4.11.6 Dark/Light Theme Toggle
- Available in sidebar (desktop) and mobile dropdown menu
- Toggles between dark and light theme
- Persisted to preferences (Firestore or localStorage)

---

## 5. Navigation Structure

### 5.1 Desktop — Sidebar
Persistent left sidebar with:
- BudgetKu logo and brand text
- Collapse/expand toggle
- Navigation items (9 pages):
  1. Dashboard
  2. Dompet (Wallet)
  3. Transaksi (Transactions)
  4. Budget
  5. Berkala (Recurring)
  6. Utang/Piutang (Debt)
  7. Investasi (Investment)
  8. Laporan (Report)
  9. Pengaturan (Settings)
- Active item highlighting
- Bottom section: user email, logout button, theme toggle, active period label

### 5.2 Mobile — Bottom Navigation + FAB
- Bottom nav bar with 5 items:
  1. Dashboard
  2. Transaksi
  3. **FAB (Floating Action Button)** — "+" button for quick transaction creation
  4. Laporan
  5. Pengaturan
- Top bar: BudgetKu logo, user avatar with dropdown menu
- Dropdown menu provides access to: Dompet, Budget, Berkala, Utang/Piutang, Investasi, Theme toggle, Logout

---

## 6. Data Persistence

### 6.1 Dual-Mode Architecture

| Mode | Storage | Trigger |
|------|---------|---------|
| Authenticated | Firebase Firestore | Firebase env vars configured + user logged in |
| Local-only | Browser localStorage | Firebase env vars missing OR no login |

### 6.2 Firestore Mode
- All data stored under `users/{uid}/` subcollections
- Atomic batch writes for transaction + wallet balance updates
- Data fetched on authentication (all collections loaded in parallel)
- Preferences auto-saved with 300ms debounce

### 6.3 Local-Only Mode
- Single localStorage key stores entire app state as JSON
- State persisted on every change (React useEffect)
- No network requests
- Data limited to current browser/device

### 6.4 Data Migration
- One-time migration from localStorage to Firestore on first authentication
- Handles wallets, transactions, budgets, categories, and preferences
- Batch writes respecting Firestore's 500-operation limit

---

## 7. Internationalization

The entire application uses Indonesian language (Bahasa Indonesia):
- All UI labels, buttons, and messages
- Date formatting (Indonesian locale: "19 Apr 2026", "Senin, 19 April 2026")
- Currency formatting (IDR: "Rp1.500.000")
- Number abbreviations ("1,5jt" for millions, "500rb" for thousands)
- Month names ("Januari", "Februari", etc.)
- Day names ("Senin", "Selasa", etc.)
- Error messages and validation feedback
- Feature names preserved in Indonesian (Utang/Piutang, Barang Berkala, etc.)

---

## 8. Responsive Design

### 8.1 Desktop (≥768px)
- Fixed sidebar navigation (collapsible)
- Multi-column layouts for dashboard and reports
- Full-width data tables
- Modal dialogs for forms
- Wider stat card grids (4 columns)

### 8.2 Mobile (<768px)
- Bottom navigation bar with FAB
- Top bar with logo and user menu
- Hero card with financial summary
- Quick menu grid for navigation shortcuts
- Single-column layouts
- Full-screen modals
- Touch-friendly tap targets
- Swipe-friendly card interactions
- Hidden sidebar (replaced by bottom nav + dropdown)

---

## Appendix: Feature Summary Matrix

| Feature | Create | Read | Update | Delete | Auto-Transaction |
|---------|--------|------|--------|--------|-----------------|
| Wallet | ✓ | ✓ | ✓ | ✓ | Balance auto-adjusted |
| Transaction | ✓ | ✓ | ✓ | ✓ | — |
| Budget | — | ✓ | ✓ | — | — |
| Category | ✓ | ✓ | ✓ | ✓ | — |
| Recurring Item | ✓ | ✓ | ✓ | ✓ | On repurchase |
| Debt | ✓ | ✓ | ✓ | ✓ | On create + payment |
| Investment | ✓ | ✓ | ✓ | ✓ | On buy + sell |
