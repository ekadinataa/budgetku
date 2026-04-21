import { Router } from 'express';
import { db } from '../config/firebase.js';
import { sendError } from '../utils/errors.js';

const router = Router();

const BATCH_LIMIT = 500;

const DEFAULT_PREFERENCES = {
  darkMode: false,
  cycleStart: 1,
  page: 'dashboard',
};

/**
 * POST /api/migrate — Bulk import localStorage data into Firestore.
 * Accepts { wallets, transactions, budgets, categories } in request body.
 * Writes all data in Firestore batches (max 500 ops per batch).
 * Preserves original IDs as document IDs for referential integrity.
 * Also creates default preferences if they don't exist.
 */
router.post('/', async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { wallets, transactions, budgets, categories } = req.body;

    // Collect all write operations as [ref, data] pairs
    const operations = [];

    // Wallets
    if (Array.isArray(wallets)) {
      for (const wallet of wallets) {
        const { id, ...data } = wallet;
        if (id) {
          const ref = db.doc(`users/${uid}/wallets/${id}`);
          operations.push({ ref, data });
        }
      }
    }

    // Transactions
    if (Array.isArray(transactions)) {
      for (const tx of transactions) {
        const { id, ...data } = tx;
        if (id) {
          const ref = db.doc(`users/${uid}/transactions/${id}`);
          operations.push({ ref, data });
        }
      }
    }

    // Budgets (object keyed by monthKey)
    if (budgets && typeof budgets === 'object' && !Array.isArray(budgets)) {
      for (const [monthKey, data] of Object.entries(budgets)) {
        const ref = db.doc(`users/${uid}/budgets/${monthKey}`);
        operations.push({ ref, data });
      }
    }

    // Categories
    if (Array.isArray(categories)) {
      for (const cat of categories) {
        const { id, ...data } = cat;
        if (id) {
          const ref = db.doc(`users/${uid}/categories/${id}`);
          operations.push({ ref, data });
        }
      }
    }

    // Create default preferences if they don't exist
    const prefsRef = db.doc(`users/${uid}/preferences/prefs`);
    const prefsDoc = await prefsRef.get();
    if (!prefsDoc.exists) {
      operations.push({ ref: prefsRef, data: { ...DEFAULT_PREFERENCES } });
    }

    // Write in batches of BATCH_LIMIT
    for (let i = 0; i < operations.length; i += BATCH_LIMIT) {
      const batch = db.batch();
      const chunk = operations.slice(i, i + BATCH_LIMIT);
      for (const { ref, data } of chunk) {
        batch.set(ref, data);
      }
      await batch.commit();
    }

    res.json({ success: true, imported: operations.length });
  } catch (error) {
    next(error);
  }
});

export default router;
