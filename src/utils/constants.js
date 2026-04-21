/**
 * Application constants for BudgetKu Money Tracker
 */

/** Wallet type options for forms and display */
export const WALLET_TYPES = [
  { value: 'bank', label: 'Bank' },
  { value: 'ewallet', label: 'E-Wallet' },
  { value: 'credit', label: 'Kartu Kredit' },
  { value: 'paylater', label: 'PayLater' },
  { value: 'cash', label: 'Tunai/Cash' },
];

/** localStorage key for persisting application state */
export const STORAGE_KEY = 'budgetku_state';

/** CSS custom property values for dark theme */
export const DARK_VARS = {
  '--bg': '#0D1117',
  '--bg-card': '#161B22',
  '--bg-2': '#0D1117',
  '--bg-3': '#1C2128',
  '--border': '#30363D',
  '--border-2': '#21262D',
  '--text-1': '#E6EDF3',
  '--text-2': '#CDD9E5',
  '--text-3': '#ADBAC7',
  '--text-4': '#768390',
  '--text-5': '#545D68',
  '--text-6': '#373E47',
  '--sidebar-bg': '#010409',
};

/** CSS custom property values for light theme */
export const LIGHT_VARS = {
  '--bg': '#F1F5F9',
  '--bg-card': '#FFFFFF',
  '--bg-2': '#F8FAFC',
  '--bg-3': '#F1F5F9',
  '--border': '#E2E8F0',
  '--border-2': '#F1F5F9',
  '--text-1': '#0F172A',
  '--text-2': '#334155',
  '--text-3': '#475569',
  '--text-4': '#64748B',
  '--text-5': '#94A3B8',
  '--text-6': '#CBD5E1',
  '--sidebar-bg': '#111827',
};
