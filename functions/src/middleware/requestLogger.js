/**
 * Request logger middleware.
 * Logs method, path, status code, and response time for each request.
 * Format: [API] GET /api/wallets 200 12ms
 */
export default function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
}
