import { Router } from 'express';
import { db } from '../config/firebase.js';
import { validate } from '../middleware/inputValidator.js';
import { sendError } from '../utils/errors.js';

const router = Router();

/**
 * GET /api/wallets — List all wallets for the authenticated user.
 */
router.get('/', async (req, res, next) => {
  try {
    const snapshot = await db
      .collection(`users/${req.user.uid}/wallets`)
      .get();

    const wallets = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(wallets);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/wallets — Create a new wallet.
 */
router.post('/', validate('wallet'), async (req, res, next) => {
  try {
    const { name, type, balance, color, note } = req.body;
    const data = { name, type, balance, color, note: note || '' };

    const docRef = await db
      .collection(`users/${req.user.uid}/wallets`)
      .add(data);

    res.status(201).json({ id: docRef.id, ...data });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/wallets/:id — Update a wallet. Verifies ownership.
 */
router.put('/:id', validate('wallet'), async (req, res, next) => {
  try {
    const docRef = db.doc(`users/${req.user.uid}/wallets/${req.params.id}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      return sendError(res, 404, 'NOT_FOUND', 'Wallet not found');
    }

    const { name, type, balance, color, note } = req.body;
    const data = { name, type, balance, color, note: note || '' };

    await docRef.update(data);
    res.json({ id: doc.id, ...data });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/wallets/:id — Delete a wallet. Verifies ownership.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const docRef = db.doc(`users/${req.user.uid}/wallets/${req.params.id}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      return sendError(res, 404, 'NOT_FOUND', 'Wallet not found');
    }

    await docRef.delete();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
