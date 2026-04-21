import { auth } from '../config/firebase.js';
import { sendError } from '../utils/errors.js';

/**
 * Auth guard middleware.
 * Extracts Bearer token from Authorization header, verifies it with
 * Firebase Admin SDK, and attaches { uid, email } to req.user.
 * Returns 401 on missing, malformed, expired, or invalid tokens.
 */
export default async function authGuard(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authorization header is required');
  }

  if (!header.startsWith('Bearer ') || header.split(' ').length !== 2) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authorization header must be in the format: Bearer <token>');
  }

  const token = header.split(' ')[1];

  if (!token) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authorization header must be in the format: Bearer <token>');
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      return sendError(res, 401, 'TOKEN_EXPIRED', 'Your session has expired. Please log in again.');
    }
    return sendError(res, 401, 'UNAUTHORIZED', 'Invalid or expired authentication token');
  }
}
