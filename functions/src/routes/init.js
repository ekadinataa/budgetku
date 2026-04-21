import { Router } from 'express';
import { db } from '../config/firebase.js';
import { sendError } from '../utils/errors.js';

const router = Router();

const DEFAULT_PREFERENCES = {
  darkMode: false,
  cycleStart: 1,
  page: 'dashboard',
};

const DEFAULT_CATEGORIES = [
  { id: 'c1', name: 'Makanan & Minum', section: 'needs', color: '#F59E0B' },
  { id: 'c2', name: 'Transport', section: 'needs', color: '#3B82F6' },
  { id: 'c3', name: 'Utilitas', section: 'needs', color: '#8B5CF6' },
  { id: 'c4', name: 'Kesehatan', section: 'needs', color: '#EF4444' },
  { id: 'c5', name: 'Pendidikan', section: 'needs', color: '#06B6D4' },
  { id: 'c6', name: 'Belanja Bulanan', section: 'needs', color: '#EC4899' },
  { id: 'c7', name: 'Hiburan', section: 'wants', color: '#F97316' },
  { id: 'c8', name: 'Makan di Luar', section: 'wants', color: '#EAB308' },
  { id: 'c9', name: 'Fashion', section: 'wants', color: '#A855F7' },
  { id: 'c10', name: 'Langganan', section: 'wants', color: '#14B8A6' },
  { id: 'c11', name: 'Hobi', section: 'wants', color: '#64748B' },
  { id: 'c12', name: 'Dana Darurat', section: 'savings', color: '#22C55E' },
  { id: 'c13', name: 'Investasi', section: 'savings', color: '#10B981' },
  { id: 'c14', name: 'Dana Pensiun', section: 'savings', color: '#059669' },
  { id: 'c15', name: 'Gaji', section: 'income', color: '#6366F1' },
  { id: 'c16', name: 'Freelance', section: 'income', color: '#8B5CF6' },
  { id: 'c17', name: 'Hasil Investasi', section: 'income', color: '#10B981' },
  { id: 'c18', name: 'Lainnya', section: 'income', color: '#94A3B8' },
];

/**
 * POST /api/init — Initialize a new user's data.
 * Checks if the user has any existing data. If not, creates default
 * categories and default preferences.
 */
router.post('/', async (req, res, next) => {
  try {
    const uid = req.user.uid;

    // Check if user already has categories (proxy for "has data")
    const categoriesSnapshot = await db
      .collection(`users/${uid}/categories`)
      .limit(1)
      .get();

    if (!categoriesSnapshot.empty) {
      return res.json({ initialized: false, message: 'User already has data' });
    }

    // Write default categories and preferences in batches
    const batch = db.batch();

    // Create default categories with their original IDs
    for (const cat of DEFAULT_CATEGORIES) {
      const { id, ...data } = cat;
      const ref = db.doc(`users/${uid}/categories/${id}`);
      batch.set(ref, data);
    }

    // Create default preferences
    const prefsRef = db.doc(`users/${uid}/preferences/prefs`);
    batch.set(prefsRef, { ...DEFAULT_PREFERENCES });

    await batch.commit();

    res.json({ initialized: true, message: 'Default data created' });
  } catch (error) {
    next(error);
  }
});

export default router;
