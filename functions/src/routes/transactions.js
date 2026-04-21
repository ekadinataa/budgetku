import { Router } from 'express';
import { db, admin } from '../config/firebase.js';
import { validate } from '../middleware/inputValidator.js';
import { sendError } from '../utils/errors.js';

const router = Router();

/**
 * Helper: get the balance adjustment for a transaction on its source wallet.
 * income  → +amount
 * expense → -amount
 * transfer → -amount (source wallet)
 */
function getBalanceEffect(type, amount) {
  if (type === 'income') return amount;
  if (type === 'expense') return -amount;
  if (type === 'transfer') return -amount;
  return 0;
}

/**
 * GET /api/transactions — List all transactions with optional filters.
 * Query params: walletId, type, categoryId, startDate, endDate, tag, search
 */
router.get('/', async (req, res, next) => {
  try {
    const { walletId, type, categoryId, startDate, endDate, tag, search } = req.query;
    let query = db.collection(`users/${req.user.uid}/transactions`);

    // Firestore-level filters (equality and range)
    if (walletId) {
      query = query.where('walletId', '==', walletId);
    }
    if (type) {
      query = query.where('type', '==', type);
    }
    if (categoryId) {
      query = query.where('categoryId', '==', categoryId);
    }

    const snapshot = await query.get();
    let transactions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // In-memory filters (Firestore doesn't support full-text search or complex range + equality combos easily)
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

    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/transactions — Create a transaction with atomic wallet balance adjustment.
 */
router.post('/', validate('transaction'), async (req, res, next) => {
  try {
    const { date, walletId, type, categoryId, amount, note, tags, toWalletId } = req.body;
    const uid = req.user.uid;

    const data = {
      date,
      walletId,
      type,
      categoryId: categoryId || null,
      amount,
      note,
      tags: tags || [],
      toWalletId: toWalletId || null,
    };

    const batch = db.batch();

    // 1. Create the transaction document
    const txRef = db.collection(`users/${uid}/transactions`).doc();
    batch.set(txRef, data);

    // 2. Adjust source wallet balance
    const walletRef = db.doc(`users/${uid}/wallets/${walletId}`);
    batch.update(walletRef, {
      balance: admin.firestore.FieldValue.increment(getBalanceEffect(type, amount)),
    });

    // 3. For transfers, also adjust destination wallet
    if (type === 'transfer' && toWalletId) {
      const toWalletRef = db.doc(`users/${uid}/wallets/${toWalletId}`);
      batch.update(toWalletRef, {
        balance: admin.firestore.FieldValue.increment(amount),
      });
    }

    await batch.commit();
    res.status(201).json({ id: txRef.id, ...data });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/transactions/:id — Update a transaction.
 * Reverses old balance effect and applies new one atomically.
 */
router.put('/:id', validate('transaction'), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const txRef = db.doc(`users/${uid}/transactions/${req.params.id}`);
    const txDoc = await txRef.get();

    if (!txDoc.exists) {
      return sendError(res, 404, 'NOT_FOUND', 'Transaction not found');
    }

    const oldTx = txDoc.data();
    const { date, walletId, type, categoryId, amount, note, tags, toWalletId } = req.body;

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

    const batch = db.batch();

    // 1. Update the transaction document
    batch.update(txRef, newData);

    // 2. Reverse old transaction's effect on source wallet
    const oldWalletRef = db.doc(`users/${uid}/wallets/${oldTx.walletId}`);
    batch.update(oldWalletRef, {
      balance: admin.firestore.FieldValue.increment(-getBalanceEffect(oldTx.type, oldTx.amount)),
    });

    // 3. Reverse old transfer destination effect
    if (oldTx.type === 'transfer' && oldTx.toWalletId) {
      const oldToWalletRef = db.doc(`users/${uid}/wallets/${oldTx.toWalletId}`);
      batch.update(oldToWalletRef, {
        balance: admin.firestore.FieldValue.increment(-oldTx.amount),
      });
    }

    // 4. Apply new transaction's effect on source wallet
    const newWalletRef = db.doc(`users/${uid}/wallets/${walletId}`);
    batch.update(newWalletRef, {
      balance: admin.firestore.FieldValue.increment(getBalanceEffect(type, amount)),
    });

    // 5. Apply new transfer destination effect
    if (type === 'transfer' && toWalletId) {
      const newToWalletRef = db.doc(`users/${uid}/wallets/${toWalletId}`);
      batch.update(newToWalletRef, {
        balance: admin.firestore.FieldValue.increment(amount),
      });
    }

    await batch.commit();
    res.json({ id: req.params.id, ...newData });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/transactions/:id — Delete a transaction and reverse its balance effect.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const txRef = db.doc(`users/${uid}/transactions/${req.params.id}`);
    const txDoc = await txRef.get();

    if (!txDoc.exists) {
      return sendError(res, 404, 'NOT_FOUND', 'Transaction not found');
    }

    const txData = txDoc.data();
    const batch = db.batch();

    // 1. Delete the transaction
    batch.delete(txRef);

    // 2. Reverse the balance effect on source wallet
    const walletRef = db.doc(`users/${uid}/wallets/${txData.walletId}`);
    batch.update(walletRef, {
      balance: admin.firestore.FieldValue.increment(-getBalanceEffect(txData.type, txData.amount)),
    });

    // 3. Reverse transfer destination effect
    if (txData.type === 'transfer' && txData.toWalletId) {
      const toWalletRef = db.doc(`users/${uid}/wallets/${txData.toWalletId}`);
      batch.update(toWalletRef, {
        balance: admin.firestore.FieldValue.increment(-txData.amount),
      });
    }

    await batch.commit();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
