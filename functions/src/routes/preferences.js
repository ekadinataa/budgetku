import { Router } from 'express';
import { db } from '../config/firebase.js';
import { validate } from '../middleware/inputValidator.js';
import { sendError } from '../utils/errors.js';

const router = Router();

const DEFAULT_PREFERENCES = {
  darkMode: false,
  cycleStart: 1,
  page: 'dashboard',
};

/**
 * GET /api/preferences — Get user preferences. Returns defaults if not found.
 */
router.get('/', async (req, res, next) => {
  try {
    const docRef = db.doc(`users/${req.user.uid}/preferences/prefs`);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.json({ ...DEFAULT_PREFERENCES });
    }

    res.json(doc.data());
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/preferences — Update user preferences.
 */
router.put('/', validate('preference'), async (req, res, next) => {
  try {
    const { darkMode, cycleStart, page } = req.body;
    const data = { darkMode, cycleStart, page };

    const docRef = db.doc(`users/${req.user.uid}/preferences/prefs`);
    await docRef.set(data);

    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
