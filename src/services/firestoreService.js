/**
 * Firestore Service — Drop-in replacement for api.js
 *
 * All CRUD operations use the Firestore client SDK directly.
 * Auth is obtained from auth.currentUser.uid (no HTTP fetch, no tokens).
 */

import { db, auth } from '../config/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  writeBatch,
  increment,
  query,
  where,
  limit,
} from 'firebase/firestore';
import {
  validateWallet,
  validateTransaction,
  validateBudget,
  validateCategory,
  validatePreference,
  trimStrings,
} from './validator';
import { CATEGORIES } from '../data/defaults';

// ── Internal helpers ─────────────────────────────────────────────────

/**
 * Returns the current user's UID.
 * Throws if not authenticated.
 */
function getUid() {
  const user = auth?.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.uid;
}

/**
 * Returns a collection reference under the current user's document.
 * e.g. userCol('wallets') → collection(db, 'users', uid, 'wallets')
 */
function userCol(sub) {
  const uid = getUid();
  return collection(db, 'users', uid, sub);
}

/**
 * Returns a document reference under the current user's document.
 * e.g. userDoc('wallets', 'w1') → doc(db, 'users', uid, 'wallets', 'w1')
 */
function userDoc(sub, id) {
  const uid = getUid();
  return doc(db, 'users', uid, sub, id);
}

/**
 * Get the balance adjustment for a transaction on its source wallet.
 * income  → +amount
 * expense → −amount
 * transfer → −amount (source wallet)
 */
function getBalanceEffect(type, amount) {
  if (type === 'income') return amount;
  if (type === 'expense') return -amount;
  if (type === 'transfer') return -amount;
  return 0;
}

// ── Wallets ──────────────────────────────────────────────────────────

export async function getWallets() {
  try {
    const snapshot = await getDocs(userCol('wallets'));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    throw new Error(`Failed to read wallets: ${err.message}`);
  }
}

export async function createWallet(data) {
  const trimmed = trimStrings(data);
  const error = validateWallet(trimmed);
  if (error) throw new Error(error);

  const { name, type, balance, color, note } = trimmed;
  const walletData = { name, type, balance, color, note: note || '' };

  try {
    const docRef = await addDoc(userCol('wallets'), walletData);
    return { id: docRef.id, ...walletData };
  } catch (err) {
    throw new Error(`Failed to create wallet: ${err.message}`);
  }
}

export async function updateWallet(id, data) {
  const trimmed = trimStrings(data);
  const error = validateWallet(trimmed);
  if (error) throw new Error(error);

  const { name, type, balance, color, note } = trimmed;
  const walletData = { name, type, balance, color, note: note || '' };

  try {
    await updateDoc(userDoc('wallets', id), walletData);
    return { id, ...walletData };
  } catch (err) {
    throw new Error(`Failed to update wallet: ${err.message}`);
  }
}

export async function deleteWallet(id) {
  try {
    await deleteDoc(userDoc('wallets', id));
    return { success: true };
  } catch (err) {
    throw new Error(`Failed to delete wallet: ${err.message}`);
  }
}

// ── Transactions ─────────────────────────────────────────────────────

export async function getTransactions(filters = {}) {
  try {
    const { walletId, type, categoryId, startDate, endDate, tag, search } = filters;

    // Build Firestore query with where() clauses for supported fields
    let q = userCol('transactions');
    const constraints = [];

    if (walletId) constraints.push(where('walletId', '==', walletId));
    if (type) constraints.push(where('type', '==', type));
    if (categoryId) constraints.push(where('categoryId', '==', categoryId));

    if (constraints.length > 0) {
      q = query(q, ...constraints);
    }

    const snapshot = await getDocs(q);
    let transactions = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    // In-memory filters
    if (startDate) {
      transactions = transactions.filter((tx) => tx.date >= startDate);
    }
    if (endDate) {
      transactions = transactions.filter((tx) => tx.date <= endDate);
    }
    if (tag) {
      transactions = transactions.filter(
        (tx) => Array.isArray(tx.tags) && tx.tags.includes(tag)
      );
    }
    if (search) {
      const searchLower = search.toLowerCase();
      transactions = transactions.filter(
        (tx) => tx.note && tx.note.toLowerCase().includes(searchLower)
      );
    }

    return transactions;
  } catch (err) {
    throw new Error(`Failed to read transactions: ${err.message}`);
  }
}

export async function createTransaction(data) {
  const trimmed = trimStrings(data);
  const error = validateTransaction(trimmed);
  if (error) throw new Error(error);

  const uid = getUid();
  const { date, walletId, type, categoryId, amount, note, tags, toWalletId } = trimmed;

  const txData = {
    date,
    walletId,
    type,
    categoryId: categoryId || null,
    amount,
    note,
    tags: tags || [],
    toWalletId: toWalletId || null,
  };

  try {
    const batch = writeBatch(db);

    // 1. Create the transaction document
    const txRef = doc(collection(db, 'users', uid, 'transactions'));
    batch.set(txRef, txData);

    // 2. Adjust source wallet balance
    const walletRef = doc(db, 'users', uid, 'wallets', walletId);
    batch.update(walletRef, {
      balance: increment(getBalanceEffect(type, amount)),
    });

    // 3. For transfers, also adjust destination wallet
    if (type === 'transfer' && toWalletId) {
      const toWalletRef = doc(db, 'users', uid, 'wallets', toWalletId);
      batch.update(toWalletRef, {
        balance: increment(amount),
      });
    }

    await batch.commit();
    return { id: txRef.id, ...txData };
  } catch (err) {
    throw new Error(`Batch operation failed (create transaction): ${err.message}`);
  }
}

export async function updateTransaction(id, data) {
  const trimmed = trimStrings(data);
  const error = validateTransaction(trimmed);
  if (error) throw new Error(error);

  const uid = getUid();

  // Read old transaction to reverse its effects
  const txRef = doc(db, 'users', uid, 'transactions', id);
  let oldTx;
  try {
    const txDoc = await getDoc(txRef);
    if (!txDoc.exists()) {
      throw new Error('Transaction not found');
    }
    oldTx = txDoc.data();
  } catch (err) {
    throw new Error(`Failed to read transaction: ${err.message}`);
  }

  const { date, walletId, type, categoryId, amount, note, tags, toWalletId } = trimmed;

  const newData = {
    date,
    walletId,
    type,
    categoryId: categoryId || null,
    amount,
    note,
    tags: tags || [],
    toWalletId: toWalletId || null,
  };

  try {
    const batch = writeBatch(db);

    // 1. Update the transaction document
    batch.update(txRef, newData);

    // 2. Reverse old transaction's effect on source wallet
    const oldWalletRef = doc(db, 'users', uid, 'wallets', oldTx.walletId);
    batch.update(oldWalletRef, {
      balance: increment(-getBalanceEffect(oldTx.type, oldTx.amount)),
    });

    // 3. Reverse old transfer destination effect
    if (oldTx.type === 'transfer' && oldTx.toWalletId) {
      const oldToWalletRef = doc(db, 'users', uid, 'wallets', oldTx.toWalletId);
      batch.update(oldToWalletRef, {
        balance: increment(-oldTx.amount),
      });
    }

    // 4. Apply new transaction's effect on source wallet
    const newWalletRef = doc(db, 'users', uid, 'wallets', walletId);
    batch.update(newWalletRef, {
      balance: increment(getBalanceEffect(type, amount)),
    });

    // 5. Apply new transfer destination effect
    if (type === 'transfer' && toWalletId) {
      const newToWalletRef = doc(db, 'users', uid, 'wallets', toWalletId);
      batch.update(newToWalletRef, {
        balance: increment(amount),
      });
    }

    await batch.commit();
    return { id, ...newData };
  } catch (err) {
    throw new Error(`Batch operation failed (update transaction): ${err.message}`);
  }
}

export async function deleteTransaction(id) {
  const uid = getUid();

  // Read the transaction to reverse its effects
  const txRef = doc(db, 'users', uid, 'transactions', id);
  let txData;
  try {
    const txDoc = await getDoc(txRef);
    if (!txDoc.exists()) {
      throw new Error('Transaction not found');
    }
    txData = txDoc.data();
  } catch (err) {
    throw new Error(`Failed to read transaction: ${err.message}`);
  }

  try {
    const batch = writeBatch(db);

    // 1. Delete the transaction
    batch.delete(txRef);

    // 2. Reverse the balance effect on source wallet
    const walletRef = doc(db, 'users', uid, 'wallets', txData.walletId);
    batch.update(walletRef, {
      balance: increment(-getBalanceEffect(txData.type, txData.amount)),
    });

    // 3. Reverse transfer destination effect
    if (txData.type === 'transfer' && txData.toWalletId) {
      const toWalletRef = doc(db, 'users', uid, 'wallets', txData.toWalletId);
      batch.update(toWalletRef, {
        balance: increment(-txData.amount),
      });
    }

    await batch.commit();
    return { success: true };
  } catch (err) {
    throw new Error(`Batch operation failed (delete transaction): ${err.message}`);
  }
}

// ── Budgets ──────────────────────────────────────────────────────────

export async function getBudgets() {
  try {
    const snapshot = await getDocs(userCol('budgets'));
    const budgets = {};
    snapshot.docs.forEach((d) => {
      budgets[d.id] = d.data();
    });
    return budgets;
  } catch (err) {
    throw new Error(`Failed to read budgets: ${err.message}`);
  }
}

export async function updateBudget(monthKey, data) {
  const error = validateBudget(data);
  if (error) throw new Error(error);

  const { totalIncome, sections } = data;
  const budgetData = { totalIncome, sections };

  try {
    await setDoc(userDoc('budgets', monthKey), budgetData);
    return budgetData;
  } catch (err) {
    throw new Error(`Failed to update budget: ${err.message}`);
  }
}

// ── Categories ───────────────────────────────────────────────────────

export async function getCategories() {
  try {
    const snapshot = await getDocs(userCol('categories'));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    throw new Error(`Failed to read categories: ${err.message}`);
  }
}

export async function createCategory(data) {
  const trimmed = trimStrings(data);
  const error = validateCategory(trimmed);
  if (error) throw new Error(error);

  const { name, section, color } = trimmed;
  const catData = { name, section, color };

  try {
    const docRef = await addDoc(userCol('categories'), catData);
    return { id: docRef.id, ...catData };
  } catch (err) {
    throw new Error(`Failed to create category: ${err.message}`);
  }
}

export async function updateCategory(id, data) {
  const trimmed = trimStrings(data);
  const error = validateCategory(trimmed);
  if (error) throw new Error(error);

  const { name, section, color } = trimmed;
  const catData = { name, section, color };

  try {
    await updateDoc(userDoc('categories', id), catData);
    return { id, ...catData };
  } catch (err) {
    throw new Error(`Failed to update category: ${err.message}`);
  }
}

export async function deleteCategory(id) {
  try {
    await deleteDoc(userDoc('categories', id));
    return { success: true };
  } catch (err) {
    throw new Error(`Failed to delete category: ${err.message}`);
  }
}

// ── Preferences ──────────────────────────────────────────────────────

const DEFAULT_PREFERENCES = {
  darkMode: false,
  cycleStart: 1,
  salaryAdjust: false,
  page: 'dashboard',
  periodMode: 'month',
  customRanges: [],
};

export async function getPreferences() {
  try {
    const uid = getUid();
    const docRef = doc(db, 'users', uid, 'preferences', 'prefs');
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { ...DEFAULT_PREFERENCES };
    }

    return snap.data();
  } catch (err) {
    throw new Error(`Failed to read preferences: ${err.message}`);
  }
}

export async function updatePreferences(data) {
  const error = validatePreference(data);
  if (error) throw new Error(error);

  const { darkMode, cycleStart, salaryAdjust, page, periodMode, customRanges } = data;
  const prefsData = {
    darkMode,
    cycleStart,
    salaryAdjust: salaryAdjust ?? false,
    page,
    periodMode: periodMode ?? 'month',
    customRanges: customRanges ?? [],
  };

  try {
    const uid = getUid();
    const docRef = doc(db, 'users', uid, 'preferences', 'prefs');
    await setDoc(docRef, prefsData);
    return prefsData;
  } catch (err) {
    throw new Error(`Failed to update preferences: ${err.message}`);
  }
}

// ── User Init ────────────────────────────────────────────────────────

export async function initUser() {
  try {
    const uid = getUid();

    // Check if user already has categories (proxy for "has data")
    const catQuery = query(
      collection(db, 'users', uid, 'categories'),
      limit(1)
    );
    const categoriesSnapshot = await getDocs(catQuery);

    if (!categoriesSnapshot.empty) {
      return { initialized: false, message: 'User already has data' };
    }

    // Write default categories and preferences in a batch
    const batch = writeBatch(db);

    for (const cat of CATEGORIES) {
      const { id, ...data } = cat;
      const ref = doc(db, 'users', uid, 'categories', id);
      batch.set(ref, data);
    }

    // Create default preferences
    const prefsRef = doc(db, 'users', uid, 'preferences', 'prefs');
    batch.set(prefsRef, { ...DEFAULT_PREFERENCES });

    await batch.commit();

    return { initialized: true, message: 'Default data created' };
  } catch (err) {
    throw new Error(`Failed to initialize user: ${err.message}`);
  }
}

// ── Reset User Data ──────────────────────────────────────────────────

const BATCH_LIMIT = 500;

export async function resetUserData() {
  try {
    const uid = getUid();
    const subcollections = ['wallets', 'transactions', 'budgets', 'categories', 'preferences'];

    // Collect all document references for deletion
    const allRefs = [];
    for (const sub of subcollections) {
      const snapshot = await getDocs(collection(db, 'users', uid, sub));
      snapshot.docs.forEach((d) => allRefs.push(d.ref));
    }

    // Batch-delete all documents respecting the 500-operation batch limit
    for (let i = 0; i < allRefs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = allRefs.slice(i, i + BATCH_LIMIT);
      for (const ref of chunk) {
        batch.delete(ref);
      }
      await batch.commit();
    }

    // Re-create default categories and preferences
    await initUser();

    return { success: true };
  } catch (err) {
    throw new Error(`Failed to reset user data: ${err.message}`);
  }
}

// ── Migration ────────────────────────────────────────────────────────

export async function migrateData(data) {
  try {
    const uid = getUid();
    const { wallets, transactions, budgets, categories } = data;

    // Collect all write operations as [ref, data] pairs
    const operations = [];

    // Wallets
    if (Array.isArray(wallets)) {
      for (const wallet of wallets) {
        const { id, ...rest } = wallet;
        if (id) {
          const ref = doc(db, 'users', uid, 'wallets', id);
          operations.push({ ref, data: rest });
        }
      }
    }

    // Transactions
    if (Array.isArray(transactions)) {
      for (const tx of transactions) {
        const { id, ...rest } = tx;
        if (id) {
          const ref = doc(db, 'users', uid, 'transactions', id);
          operations.push({ ref, data: rest });
        }
      }
    }

    // Budgets (object keyed by monthKey)
    if (budgets && typeof budgets === 'object' && !Array.isArray(budgets)) {
      for (const [monthKey, budgetData] of Object.entries(budgets)) {
        const ref = doc(db, 'users', uid, 'budgets', monthKey);
        operations.push({ ref, data: budgetData });
      }
    }

    // Categories
    if (Array.isArray(categories)) {
      for (const cat of categories) {
        const { id, ...rest } = cat;
        if (id) {
          const ref = doc(db, 'users', uid, 'categories', id);
          operations.push({ ref, data: rest });
        }
      }
    }

    // Create default preferences if they don't exist
    const prefsRef = doc(db, 'users', uid, 'preferences', 'prefs');
    const prefsDoc = await getDoc(prefsRef);
    if (!prefsDoc.exists()) {
      operations.push({ ref: prefsRef, data: { ...DEFAULT_PREFERENCES } });
    }

    // Write in batches of BATCH_LIMIT
    for (let i = 0; i < operations.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = operations.slice(i, i + BATCH_LIMIT);
      for (const op of chunk) {
        batch.set(op.ref, op.data);
      }
      await batch.commit();
    }

    return { success: true, imported: operations.length };
  } catch (err) {
    throw new Error(`Failed to migrate data: ${err.message}`);
  }
}
