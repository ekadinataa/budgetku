# BudgetX — Development Playbook

**Version:** 1.0  
**Last Updated:** July 2025  

---

## 1. Quick Start

### Prerequisites
- Node.js **v20+** (LTS recommended)
- npm **v10+**
- Firebase CLI (`npm install -g firebase-tools`)
- Git

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd budgetku

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Firebase credentials (or leave empty for local-only mode)

# 4. Start development server
npm run dev
# App available at http://localhost:5173

# 5. Run tests
npm test
```

### Local-Only Mode (No Firebase)

If `.env` has no Firebase credentials, the app runs entirely client-side with localStorage. No Firebase project needed for local development.

---

## 2. Development Workflow

### Branch Strategy

```
main              ← Production-ready code (deployed)
├── feat/xxx      ← New features
├── fix/xxx       ← Bug fixes
├── refactor/xxx  ← Code improvements
└── docs/xxx      ← Documentation changes
```

### Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add debt amortization table
fix: correct wallet balance on transfer deletion
refactor: extract period calculation to utility
docs: update deployment SOP
style: fix dark theme contrast on debt cards
test: add property tests for annuity calculator
```

### PR Process

1. Create a feature branch from `main`
2. Make changes, commit with conventional messages
3. Run `npm run lint` and `npm test` locally
4. Push and create a Pull Request
5. Self-review (single-developer model) or peer-review if available
6. Merge to `main` → deploy

---

## 3. Environment Setup

### Required Environment Variables

```env
# .env (local development)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

All variables are prefixed with `VITE_` (required by Vite to expose to client-side code).

### Firebase CLI

```bash
# Login to Firebase
firebase login

# Set project
firebase use budgetku-app-v1

# Verify
firebase projects:list
```

### Node Version

Use Node 20 LTS or higher. Recommended: use `nvm` for version management.

```bash
nvm use 20
```

---

## 4. Project Architecture

### Folder Structure Quick Reference

```
budgetku/
├── src/
│   ├── App.jsx                 # State owner, routing, CRUD handlers
│   ├── App.css                 # Global styles, CSS custom properties, theme vars
│   ├── main.jsx                # Entry: React root + providers
│   ├── components/             # Reusable UI (Sidebar, charts, ui primitives)
│   ├── pages/                  # Feature pages (Dashboard, Wallet, Tx, etc.)
│   ├── services/               # Data access: firestoreService, validators, import/export
│   ├── utils/                  # Pure helper functions (formatters, calculators)
│   ├── context/                # React contexts (Auth, Theme)
│   ├── data/                   # Static defaults (demo data)
│   ├── config/                 # Firebase initialization
│   └── hooks/                  # Custom React hooks
├── public/                     # Static assets (SVGs)
├── functions/                  # Cloud Functions (Express API, currently secondary)
├── dist/                       # Build output
├── firebase.json               # Hosting + Firestore config
├── firestore.rules             # Security rules
└── package.json
```

### Architecture Principles

| Principle | Implementation |
|-----------|---------------|
| Single source of truth | All state in `App.jsx` |
| No router library | `page` state + `renderPage()` switch |
| No state library | `useState` + props drilling |
| Pure business logic | `utils/` — no side effects |
| Scoped styles | CSS Modules per component |
| Dual persistence | Firestore (cloud) or localStorage (offline) |
| Atomic writes | Firestore batch for tx + balance |

---

## 5. Adding a New Feature

Follow this step-by-step template:

### Step 1: Create Utility Helpers

Create pure functions in `src/utils/yourFeature.js`:

```javascript
// src/utils/yourFeatureHelpers.js
export function computeSomething(input) {
  // Pure function — no side effects, easily testable
  return result;
}
```

### Step 2: Create Validator

Add validation logic in `src/services/yourFeatureValidator.js`:

```javascript
// src/services/yourFeatureValidator.js
export function validateYourFeature(data) {
  if (!data.name?.trim()) return 'Nama wajib diisi.';
  if (data.amount <= 0) return 'Jumlah harus lebih dari 0.';
  return null; // null = valid
}
```

### Step 3: Add Firestore CRUD

Add operations to `src/services/firestoreService.js`:

```javascript
// In firestoreService.js
export async function getYourItems() {
  const snap = await getDocs(userCol('yourItems'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createYourItem(data) {
  const ref = await addDoc(userCol('yourItems'), data);
  return { id: ref.id, ...data };
}

export async function updateYourItem(id, data) {
  await updateDoc(userDoc('yourItems', id), data);
  return { id, ...data };
}

export async function deleteYourItem(id) {
  await deleteDoc(userDoc('yourItems', id));
}
```

### Step 4: Add State + Handlers to App.jsx

```javascript
// In App.jsx
const [yourItems, setYourItems] = useState(savedLocal?.yourItems || []);

const handleCreateYourItem = async (data) => {
  const error = validateYourFeature(data);
  if (error) { showToast(error); throw new Error(error); }
  
  if (IS_LOCAL_MODE) {
    const created = { id: 'yi_' + Date.now(), ...data };
    setYourItems(items => [...items, created]);
    return created;
  }
  try {
    const created = await api.createYourItem(data);
    setYourItems(items => [...items, created]);
    return created;
  } catch (err) {
    showToast(err.message || 'Gagal membuat item.');
    throw err;
  }
};
```

### Step 5: Create Page Component + CSS Module

```
src/pages/YourFeature/
├── YourFeaturePage.jsx
├── YourFeaturePage.module.css
├── YourFeatureFormModal.jsx
└── YourFeatureFormModal.module.css
```

### Step 6: Add Routing

In `App.jsx`, add the case in `renderPage()`:

```javascript
case 'yourFeature': return <YourFeaturePage 
  yourItems={yourItems}
  onCreateItem={handleCreateYourItem}
  // ... other props
/>;
```

### Step 7: Add Navigation

**Sidebar (desktop):** Add entry to `NAV_ITEMS` in `Sidebar.jsx`:

```javascript
{ id: 'yourFeature', label: 'Fitur Baru', icon: '🆕' }
```

**Dashboard quick menu (mobile):** Add entry in `Dashboard.jsx` quick menu grid.

### Step 8: Build & Deploy

```bash
npm run build
firebase deploy --only hosting:budgetx
```

---

## 6. Coding Conventions

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| React components | PascalCase | `WalletPage.jsx`, `TxFormModal.jsx` |
| CSS Modules | Match component | `WalletPage.module.css` |
| Utilities | camelCase | `debtHelpers.js`, `formatters.js` |
| Services | camelCase | `firestoreService.js`, `debtValidator.js` |
| Constants | camelCase file, UPPER_CASE exports | `constants.js` → `STORAGE_KEY` |

### CSS Modules Pattern

```jsx
// Always import as `styles`
import styles from './MyComponent.module.css';

// Use bracket notation for kebab-case class names
<div className={styles.wrapper}>
<div className={styles['stat-card']}>

// Combine classes
<div className={`${styles.card} ${isActive ? styles.active : ''}`}>
```

### Props Interface Documentation

Document expected props at the top of each component:

```javascript
/**
 * WalletPage — Manages wallet CRUD operations
 * 
 * @param {Array} wallets - List of wallet objects
 * @param {Function} onCreateWallet - (data) => Promise
 * @param {Function} onUpdateWallet - (id, data) => Promise
 * @param {Function} onDeleteWallet - (id) => Promise
 */
function WalletPage({ wallets, onCreateWallet, onUpdateWallet, onDeleteWallet }) {
```

### Indonesian Language UI Text

All user-facing text must be in Indonesian:

```javascript
// ✅ Correct
showToast('Dompet berhasil dihapus.');
<button>Tambah Transaksi</button>
<label>Jumlah (Rp)</label>

// ❌ Wrong
showToast('Wallet deleted successfully.');
<button>Add Transaction</button>
```

### Error Handling

Use toast notifications for user-facing errors:

```javascript
try {
  await api.createWallet(data);
} catch (err) {
  showToast(err.message || 'Gagal membuat dompet.');
  throw err; // Re-throw if caller needs to handle
}
```

### State Management

- All app state lifted to `App.jsx`
- Pass state down via props
- Pass handler functions (`onCreateX`, `onUpdateX`, `onDeleteX`) as callbacks
- No global state libraries (Redux, Zustand, etc.)
- UI-only state (modals, form fields) lives in the component that owns it

---

## 7. Deployment Process

### Build

```bash
# Production build (Vite + Rolldown)
npm run build
# Output: dist/ directory
```

### Deploy to Firebase Hosting

```bash
# Deploy to the budgetx hosting site
firebase deploy --only hosting:budgetx

# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy everything
firebase deploy
```

### Multiple Hosting Sites

The project has two Firebase Hosting sites:

| Site | URL | Purpose |
|------|-----|---------|
| `budgetku-app-v1` | budgetku-app-v1.web.app | Legacy (redirects to budgetx) |
| `budgetx` | budgetx.web.app | **Primary production site** |

Configured in `.firebaserc` and `firebase.json`.

### Rollback

```bash
# List recent deployments
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:rollback --site budgetx
```

---

## 8. Common Issues & Fixes

### useCallback After Early Returns

**Problem:** React hooks cannot be called after conditional early returns.

```javascript
// ❌ Will cause "rendered fewer hooks" error
if (loading) return <Spinner />;
const handleSomething = useCallback(() => {}, []);

// ✅ Move all hooks before early returns
const handleSomething = useCallback(() => {}, []);
if (loading) return <Spinner />;
```

### Firestore Field Storage

**Problem:** Firestore doesn't store `undefined` fields — they're silently dropped.

```javascript
// ❌ Field won't exist in Firestore
{ dueDate: undefined }

// ✅ Use empty string or null for "no value"
{ dueDate: '' }
{ dueDate: null }
```

### Overflow on Mobile

**Problem:** Long text or tables overflow on mobile viewport.

```css
/* ✅ Add overflow handling */
.container {
  overflow-x: auto;
  word-break: break-word;
}

/* For tables */
.tableWrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
```

### Dark Theme Contrast

**Problem:** Text not readable in dark mode because of hardcoded colors.

```css
/* ❌ Hardcoded color */
color: #333;

/* ✅ Use CSS custom properties */
color: var(--text-1);
background: var(--bg-2);
border-color: var(--border);
```

### Batch Write Limits

**Problem:** Firestore batch writes limited to 500 operations.

```javascript
// For large imports, chunk into batches of 450
const chunks = chunkArray(items, 450);
for (const chunk of chunks) {
  const batch = writeBatch(db);
  chunk.forEach(item => batch.set(docRef, item));
  await batch.commit();
}
```

### localStorage Quota

**Problem:** localStorage has ~5MB limit per origin.

When data exceeds limit, the app may fail silently. For power users, recommend migrating to authenticated (Firestore) mode.

---

## 9. Testing

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest run src/__tests__/utils/debtHelpers.test.js
```

### Test Stack

| Tool | Purpose |
|------|---------|
| Vitest | Test runner |
| @testing-library/react | Component testing |
| fast-check | Property-based testing |
| jsdom | DOM environment |

### Adding Property-Based Tests

Use `fast-check` for testing pure utility functions:

```javascript
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calcAnnuityInstallment } from '../../utils/debtHelpers';

describe('calcAnnuityInstallment', () => {
  it('should always return positive for valid inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 1000000000 }),  // principal
        fc.float({ min: 0.1, max: 30, noNaN: true }), // rate
        fc.integer({ min: 1, max: 360 }),              // tenor
        (principal, rate, tenor) => {
          const result = calcAnnuityInstallment(principal, rate, tenor);
          expect(result).toBeGreaterThan(0);
        }
      )
    );
  });

  it('total payments should exceed principal when interest > 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 1000000000 }),
        fc.float({ min: 0.1, max: 30, noNaN: true }),
        fc.integer({ min: 2, max: 360 }),
        (principal, rate, tenor) => {
          const monthly = calcAnnuityInstallment(principal, rate, tenor);
          expect(monthly * tenor).toBeGreaterThanOrEqual(principal);
        }
      )
    );
  });
});
```

### Test File Organization

```
src/__tests__/
├── components/       # Component tests
├── context/          # Context/provider tests
├── services/         # Service layer tests
└── utils/            # Utility function tests (unit + property-based)
```

---

## 10. Firebase Management

### Adding a New Hosting Site

```bash
# Add a new hosting site
firebase hosting:sites:create new-site-name

# Add target in .firebaserc
firebase target:apply hosting alias new-site-name

# Update firebase.json with the new site config
```

### Firestore Security Rules

Rules are defined in `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;  // Default deny
    }
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Key principle:** Users can only read/write their own data. No cross-user access.

Deploy rules:

```bash
firebase deploy --only firestore:rules
```

### Data Reset (Manual)

To reset a specific user's data via Firebase Console:

1. Open Firebase Console → Firestore
2. Navigate to `users/{uid}`
3. Delete all subcollections (wallets, transactions, budgets, categories, preferences, recurringItems, debts, investments)
4. User's next login will trigger `initUser()` which re-creates defaults

### Backup Strategy

Users export their own data via Settings → Export (JSON or CSV). There is no server-side backup system. For admin backup:

```bash
# Export Firestore data (requires gcloud)
gcloud firestore export gs://your-bucket/backups/$(date +%Y%m%d)
```

### Firebase Console Quick Links

- **Hosting:** Console → Hosting → view deployment history, rollback
- **Auth:** Console → Authentication → manage users, reset passwords
- **Firestore:** Console → Firestore → browse data, run queries
- **Usage:** Console → Usage and billing → monitor quota consumption

---

## Appendix: Useful Commands

```bash
# Development
npm run dev              # Start dev server (Vite HMR)
npm run build            # Production build
npm run preview          # Preview production build locally
npm run lint             # Run ESLint
npm test                 # Run tests (once)
npm run test:watch       # Run tests (watch mode)

# Firebase
firebase login           # Authenticate CLI
firebase deploy          # Deploy all (hosting + rules)
firebase deploy --only hosting:budgetx    # Deploy hosting only
firebase deploy --only firestore:rules    # Deploy rules only
firebase hosting:rollback --site budgetx  # Rollback hosting

# Utilities
npx vitest run --reporter=verbose  # Verbose test output
npx eslint . --fix                 # Auto-fix lint issues
```
