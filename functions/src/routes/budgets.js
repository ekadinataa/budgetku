import { Router } from 'express';
import { db } from '../config/firebase.js';
import { validate } from '../middleware/inputValidator.js';
import { sendError } from '../utils/errors.js';

const router = Router();

/**
 * GET /api/budgets — List all monthly budgets for the authenticated user.
 */
router.get('/', async (req, res, next) => {
  try {
    const snapshot = await db
      .collection(`users/${req.user.uid}/budgets`)
      .get();

    const budgets = {};
    snapshot.docs.forEach((doc) => {
      budgets[doc.id] = doc.data();
    });
    res.json(budgets);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/budgets/:monthKey — Get budget for a specific month.
 * Returns an empty default if not found.
 */
router.get('/:monthKey', async (req, res, next) => {
  try {
    const docRef = db.doc(`users/${req.user.uid}/budgets/${req.params.monthKey}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.json({
        totalIncome: 0,
        sections: {
          needs: { total: 0, cats: [] },
          wants: { total: 0, cats: [] },
          savings: { total: 0, cats: [] },
        },
      });
    }

    res.json(doc.data());
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/budgets/:monthKey — Create or update budget for a specific month.
 */
router.put('/:monthKey', validate('budget'), async (req, res, next) => {
  try {
    const { totalIncome, sections } = req.body;
    const data = { totalIncome, sections };

    const docRef = db.doc(`users/${req.user.uid}/budgets/${req.params.monthKey}`);
    await docRef.set(data);

    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
