import { Request, Response, NextFunction } from 'express';
import { AppError } from '../services/uploadService';
import { logError } from '../utils/logger';

/**
 * Global Express error handler.
 *
 * Maps typed AppErrors to their HTTP status codes.
 * Strips stack traces from responses — logged server-side only.
 * Logs with correlation ID for support tracing (Requirement 9.2).
 * Never exposes internal error details to the client (Requirement 7.5).
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const correlationId =
    (req.headers['x-correlation-id'] as string) ?? 'unknown';

  if (err instanceof AppError) {
    // Log the error server-side with correlation ID (no resume content)
    logError(
      correlationId,
      'express',
      err.name,
      err.message,
      err.stack,
    );

    // Send user-facing message only — no stack trace, no internal details
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Unknown/unexpected error — log and return generic 500
  const message =
    err instanceof Error ? err.message : 'An unexpected error occurred.';
  const stack = err instanceof Error ? err.stack : undefined;

  logError(correlationId, 'express', 'UnknownError', message, stack);

  if (!res.headersSent) {
    res.status(500).json({
      error: 'An unexpected error occurred. Please try again.',
      errors: ['Internal processing failure'],
    });
  }
}
