/**
 * Centralized API client for BudgetKu backend.
 *
 * Attaches Firebase ID token as Bearer token to all requests.
 * API_BASE defaults to http://localhost:3001/api if VITE_API_URL is not set.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ── Token getter ─────────────────────────────────────────────────────
let _getToken = null;

/**
 * Set the token getter function. Called by AuthContext on mount.
 * @param {() => Promise<string|null>} fn
 */
export function setTokenGetter(fn) {
  _getToken = fn;
}

// ── ApiError ─────────────────────────────────────────────────────────

export class ApiError extends Error {
  /**
   * @param {number} status - HTTP status code
   * @param {string} message - Error message
   * @param {string} [code] - Error code from the API
   */
  constructor(status, message, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code || 'UNKNOWN_ERROR';
  }
}

// ── Core fetch wrapper ───────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (_getToken) {
    try {
      const token = await _getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // Token not available yet — proceed without auth header
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      body.error?.message || 'Request failed',
      body.error?.code,
    );
  }

  // Handle 204 No Content
  if (res.status === 204) return null;

  return res.json();
}

// ── Wallets ──────────────────────────────────────────────────────────

export function getWallets() {
  return apiFetch('/wallets');
}

export function createWallet(data) {
  return apiFetch('/wallets', { method: 'POST', body: JSON.stringify(data) });
}

export function updateWallet(id, data) {
  return apiFetch(`/wallets/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteWallet(id) {
  return apiFetch(`/wallets/${id}`, { method: 'DELETE' });
}

// ── Transactions ─────────────────────────────────────────────────────

export function getTransactions(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      params.append(key, val);
    }
  });
  const qs = params.toString();
  return apiFetch(`/transactions${qs ? `?${qs}` : ''}`);
}

export function createTransaction(data) {
  return apiFetch('/transactions', { method: 'POST', body: JSON.stringify(data) });
}

export function updateTransaction(id, data) {
  return apiFetch(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteTransaction(id) {
  return apiFetch(`/transactions/${id}`, { method: 'DELETE' });
}

// ── Budgets ──────────────────────────────────────────────────────────

export function getBudgets() {
  return apiFetch('/budgets');
}

export function updateBudget(monthKey, data) {
  return apiFetch(`/budgets/${monthKey}`, { method: 'PUT', body: JSON.stringify(data) });
}

// ── Categories ───────────────────────────────────────────────────────

export function getCategories() {
  return apiFetch('/categories');
}

export function createCategory(data) {
  return apiFetch('/categories', { method: 'POST', body: JSON.stringify(data) });
}

export function updateCategory(id, data) {
  return apiFetch(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteCategory(id) {
  return apiFetch(`/categories/${id}`, { method: 'DELETE' });
}

// ── Preferences ──────────────────────────────────────────────────────

export function getPreferences() {
  return apiFetch('/preferences');
}

export function updatePreferences(data) {
  return apiFetch('/preferences', { method: 'PUT', body: JSON.stringify(data) });
}

// ── Migration ────────────────────────────────────────────────────────

export function migrateData(data) {
  return apiFetch('/migrate', { method: 'POST', body: JSON.stringify(data) });
}

// ── User Init ────────────────────────────────────────────────────────

export function initUser() {
  return apiFetch('/init', { method: 'POST' });
}
