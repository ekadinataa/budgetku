import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import requestLogger from './src/middleware/requestLogger.js';
import { generalLimiter } from './src/middleware/rateLimiter.js';
import authGuard from './src/middleware/authGuard.js';
import { sendError } from './src/utils/errors.js';

import healthRouter from './src/routes/health.js';
import walletsRouter from './src/routes/wallets.js';
import transactionsRouter from './src/routes/transactions.js';
import budgetsRouter from './src/routes/budgets.js';
import categoriesRouter from './src/routes/categories.js';
import preferencesRouter from './src/routes/preferences.js';
import migrateRouter from './src/routes/migrate.js';
import initRouter from './src/routes/init.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(requestLogger);
app.use(generalLimiter);
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/health', healthRouter);
app.use('/api/wallets', authGuard, walletsRouter);
app.use('/api/transactions', authGuard, transactionsRouter);
app.use('/api/budgets', authGuard, budgetsRouter);
app.use('/api/categories', authGuard, categoriesRouter);
app.use('/api/preferences', authGuard, preferencesRouter);
app.use('/api/migrate', authGuard, migrateRouter);
app.use('/api/init', authGuard, initRouter);

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  sendError(res, err.status || 500, err.code || 'INTERNAL_ERROR', 'An unexpected error occurred');
});

// Export as Firebase Cloud Function (2nd gen)
export const api = onRequest({ region: 'asia-southeast2', cors: true }, app);
