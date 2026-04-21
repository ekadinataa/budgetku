import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import requestLogger from './middleware/requestLogger.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import authGuard from './middleware/authGuard.js';
import { sendError } from './utils/errors.js';

import healthRouter from './routes/health.js';
import walletsRouter from './routes/wallets.js';
import transactionsRouter from './routes/transactions.js';
import budgetsRouter from './routes/budgets.js';
import categoriesRouter from './routes/categories.js';
import preferencesRouter from './routes/preferences.js';
import migrateRouter from './routes/migrate.js';
import initRouter from './routes/init.js';

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware chain ---
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(requestLogger);
app.use(generalLimiter);
app.use(express.json({ limit: '1mb' }));

// --- Routes ---
app.use('/api/health', healthRouter);
app.use('/api/wallets', authGuard, walletsRouter);
app.use('/api/transactions', authGuard, transactionsRouter);
app.use('/api/budgets', authGuard, budgetsRouter);
app.use('/api/categories', authGuard, categoriesRouter);
app.use('/api/preferences', authGuard, preferencesRouter);
app.use('/api/migrate', authGuard, migrateRouter);
app.use('/api/init', authGuard, initRouter);

// --- Global error handler ---
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  sendError(res, err.status || 500, err.code || 'INTERNAL_ERROR', 'An unexpected error occurred');
});

// --- Start server (only when run directly, not when imported for testing) ---
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`BudgetKu API running on port ${PORT}`);
  });
}

export default app;
