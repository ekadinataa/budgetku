import { Router } from 'express';
import { db } from '../config/firebase.js';
import { validate } from '../middleware/inputValidator.js';
import { sendError } from '../utils/errors.js';

const router = Router();

/**
 * GET /api/categories — List all categories for the authenticated user.
 */
router.get('/', async (req, res, next) => {
  try {
    const snapshot = await db
      .collection(`users/${req.user.uid}/categories`)
      .get();

    const categories = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/categories — Create a new category.
 */
router.post('/', validate('category'), async (req, res, next) => {
  try {
    const { name, section, color } = req.body;
    const data = { name, section, color };

    const docRef = await db
      .collection(`users/${req.user.uid}/categories`)
      .add(data);

    res.status(201).json({ id: docRef.id, ...data });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/categories/:id — Update a category.
 */
router.put('/:id', validate('category'), async (req, res, next) => {
  try {
    const docRef = db.doc(`users/${req.user.uid}/categories/${req.params.id}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      return sendError(res, 404, 'NOT_FOUND', 'Category not found');
    }

    const { name, section, color } = req.body;
    const data = { name, section, color };

    await docRef.update(data);
    res.json({ id: doc.id, ...data });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/categories/:id — Delete a category.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const docRef = db.doc(`users/${req.user.uid}/categories/${req.params.id}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      return sendError(res, 404, 'NOT_FOUND', 'Category not found');
    }

    await docRef.delete();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
