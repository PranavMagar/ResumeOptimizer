import { Request, Response, NextFunction } from 'express';

const REQUEST_TIMEOUT_MS = 30_000; // 30 seconds (Requirement 9.3)

/**
 * Express middleware that enforces a 30-second hard timeout on all requests.
 *
 * If the request is not completed within 30 seconds, responds with HTTP 408
 * and a user-friendly message. This satisfies Requirement 9.3 and the design's
 * 30-second hard timeout constraint.
 */
export function timeoutMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        error: 'Processing took too long. Please try again with a smaller file.',
      });
    }
  }, REQUEST_TIMEOUT_MS);

  // Clear the timeout when the response finishes (success or error)
  res.on('finish', () => clearTimeout(timer));
  res.on('close', () => clearTimeout(timer));

  next();
}
