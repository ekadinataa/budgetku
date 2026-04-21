import { describe, it, expect } from 'vitest';
import { sendError, AppError } from '../utils/errors.js';

describe('Project setup verification', () => {
  it('sendError sends a standardized error response', () => {
    const res = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; },
    };

    sendError(res, 400, 'VALIDATION_ERROR', 'Name is required');

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: { code: 'VALIDATION_ERROR', message: 'Name is required' },
    });
  });

  it('AppError carries status, code, and message', () => {
    const err = new AppError(404, 'NOT_FOUND', 'Resource not found');

    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Resource not found');
    expect(err.name).toBe('AppError');
  });

  it('Express app exports correctly', async () => {
    const { default: app } = await import('../index.js');
    expect(typeof app).toBe('function');
    expect(typeof app.use).toBe('function');
    expect(typeof app.listen).toBe('function');
  });
});
