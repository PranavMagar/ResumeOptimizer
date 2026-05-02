/**
 * Structured logger for the AI Resume Optimizer backend.
 *
 * Logging rules (Requirement 10.3, Design logging rules):
 * - Every log entry includes: correlationId, service, errorType, timestamp
 * - NEVER logs: resume text, file contents, parsed text, PII
 * - Stack traces are logged server-side only, never sent to clients
 */

export interface LogEntry {
  correlationId: string;
  service: string;
  errorType?: string;
  message: string;
  timestamp: string;
}

/**
 * Logs a structured info entry. Safe fields only — no resume content or PII.
 */
export function logInfo(
  correlationId: string,
  service: string,
  message: string,
): void {
  const entry: LogEntry = {
    correlationId,
    service,
    message,
    timestamp: new Date().toISOString(),
  };
  console.log(JSON.stringify(entry));
}

/**
 * Logs a structured error entry. Includes errorType but NEVER resume content,
 * file paths, or PII. Stack traces are included server-side only.
 */
export function logError(
  correlationId: string,
  service: string,
  errorType: string,
  message: string,
  stack?: string,
): void {
  const entry: LogEntry & { stack?: string } = {
    correlationId,
    service,
    errorType,
    message,
    timestamp: new Date().toISOString(),
    // Stack trace logged server-side only — never sent to client
    ...(stack ? { stack } : {}),
  };
  console.error(JSON.stringify(entry));
}
