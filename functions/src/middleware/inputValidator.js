import { sendError } from '../utils/errors.js';

const MAX_STRING_LENGTH = 1000;
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Trim all string values in an object (shallow).
 * Returns a new object with trimmed strings.
 */
function trimStrings(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (typeof result[key] === 'string') {
      result[key] = result[key].trim();
    }
    if (Array.isArray(result[key])) {
      result[key] = result[key].map((item) =>
        typeof item === 'string' ? item.trim() : item
      );
    }
  }
  return result;
}

/**
 * Check if any string value in the object exceeds the max length.
 * Returns the field name that exceeds, or null if all are fine.
 */
function findOversizedString(obj) {
  if (!obj || typeof obj !== 'object') return null;
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
      return key;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item.length > MAX_STRING_LENGTH) {
          return key;
        }
      }
    }
  }
  return null;
}

// --- Validation schemas ---

const WALLET_TYPES = ['bank', 'ewallet', 'credit', 'paylater', 'cash'];

function walletSchema(body) {
  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    return 'Wallet name is required';
  }
  if (!WALLET_TYPES.includes(body.type)) {
    return `Wallet type must be one of: ${WALLET_TYPES.join(', ')}`;
  }
  if (typeof body.balance !== 'number' || Number.isNaN(body.balance)) {
    return 'Balance must be a valid number';
  }
  if (!body.color || !HEX_COLOR_REGEX.test(body.color)) {
    return 'Color must be a valid hex color (e.g. #FF0000)';
  }
  if (body.note !== undefined && typeof body.note !== 'string') {
    return 'Note must be a string';
  }
  return null;
}

const TRANSACTION_TYPES = ['income', 'expense', 'transfer'];

function transactionSchema(body) {
  if (!body.date || typeof body.date !== 'string' || !DATE_REGEX.test(body.date)) {
    return 'Date must be in YYYY-MM-DD format';
  }
  if (!body.walletId || typeof body.walletId !== 'string' || body.walletId.trim() === '') {
    return 'Wallet ID is required';
  }
  if (!TRANSACTION_TYPES.includes(body.type)) {
    return `Transaction type must be one of: ${TRANSACTION_TYPES.join(', ')}`;
  }
  if (body.categoryId !== null && body.categoryId !== undefined && typeof body.categoryId !== 'string') {
    return 'Category ID must be a string or null';
  }
  if (typeof body.amount !== 'number' || Number.isNaN(body.amount) || body.amount <= 0) {
    return 'Amount must be a positive number';
  }
  if (typeof body.note !== 'string') {
    return 'Note must be a string';
  }
  if (!Array.isArray(body.tags) || !body.tags.every((t) => typeof t === 'string')) {
    return 'Tags must be an array of strings';
  }
  if (body.type === 'transfer') {
    if (!body.toWalletId || typeof body.toWalletId !== 'string' || body.toWalletId.trim() === '') {
      return 'Destination wallet ID (toWalletId) is required for transfers';
    }
  }
  return null;
}

const BUDGET_SECTIONS = ['needs', 'wants', 'savings'];

function budgetSchema(body) {
  if (typeof body.totalIncome !== 'number' || Number.isNaN(body.totalIncome) || body.totalIncome < 0) {
    return 'Total income must be a non-negative number';
  }
  if (!body.sections || typeof body.sections !== 'object') {
    return 'Sections object is required';
  }
  for (const section of BUDGET_SECTIONS) {
    const s = body.sections[section];
    if (!s || typeof s !== 'object') {
      return `Section "${section}" is required`;
    }
    if (typeof s.total !== 'number' || Number.isNaN(s.total) || s.total < 0) {
      return `Section "${section}" total must be a non-negative number`;
    }
    if (!Array.isArray(s.cats)) {
      return `Section "${section}" cats must be an array`;
    }
    for (const cat of s.cats) {
      if (!cat || typeof cat !== 'object') {
        return `Each category in "${section}" must be an object`;
      }
      if (typeof cat.id !== 'string' || cat.id.trim() === '') {
        return `Each category in "${section}" must have a string id`;
      }
      if (typeof cat.amt !== 'number' || Number.isNaN(cat.amt) || cat.amt < 0) {
        return `Each category amount in "${section}" must be a non-negative number`;
      }
    }
  }
  return null;
}

const CATEGORY_SECTIONS = ['needs', 'wants', 'savings', 'income'];

function categorySchema(body) {
  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    return 'Category name is required';
  }
  if (!CATEGORY_SECTIONS.includes(body.section)) {
    return `Category section must be one of: ${CATEGORY_SECTIONS.join(', ')}`;
  }
  if (!body.color || !HEX_COLOR_REGEX.test(body.color)) {
    return 'Color must be a valid hex color (e.g. #FF0000)';
  }
  return null;
}

function preferenceSchema(body) {
  if (typeof body.darkMode !== 'boolean') {
    return 'darkMode must be a boolean';
  }
  if (
    typeof body.cycleStart !== 'number' ||
    !Number.isInteger(body.cycleStart) ||
    body.cycleStart < 1 ||
    body.cycleStart > 28
  ) {
    return 'cycleStart must be an integer between 1 and 28';
  }
  if (typeof body.page !== 'string') {
    return 'page must be a string';
  }
  return null;
}

const schemas = {
  wallet: walletSchema,
  transaction: transactionSchema,
  budget: budgetSchema,
  category: categorySchema,
  preference: preferenceSchema,
};

/**
 * Validation middleware factory.
 * Usage: router.post('/', validate('wallet'), handler)
 *
 * Trims all string inputs, rejects strings > 1000 chars,
 * validates against the named schema, and returns 400 with
 * VALIDATION_ERROR on failure.
 *
 * @param {string} schemaName - One of: wallet, transaction, budget, category, preference
 * @returns {Function} Express middleware
 */
export function validate(schemaName) {
  const schemaFn = schemas[schemaName];
  if (!schemaFn) {
    throw new Error(`Unknown validation schema: ${schemaName}`);
  }

  return (req, res, next) => {
    // Trim all string values
    req.body = trimStrings(req.body);

    // Check for oversized strings
    const oversizedField = findOversizedString(req.body);
    if (oversizedField) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        `Field "${oversizedField}" exceeds maximum length of ${MAX_STRING_LENGTH} characters`
      );
    }

    // Run schema validation
    const error = schemaFn(req.body);
    if (error) {
      return sendError(res, 400, 'VALIDATION_ERROR', error);
    }

    next();
  };
}
