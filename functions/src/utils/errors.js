/**
 * Standardized error response helper.
 * All API errors follow the format: { error: { code, message } }
 */
export function sendError(res, status, code, message) {
  return res.status(status).json({
    error: { code, message },
  });
}

/**
 * Custom application error class.
 * Carries an HTTP status and error code for consistent error handling.
 */
export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'AppError';
  }
}
