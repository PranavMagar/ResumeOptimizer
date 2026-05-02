interface ErrorNoticeProps {
  errors: string[];
}

/**
 * ErrorNotice — renders user-facing error messages from the errors[] array.
 *
 * MUST NOT display HTTP status codes, stack traces, file paths, or internal
 * service names (Requirement 8.6, 9.5, Design Property 20).
 *
 * Only renders the message strings as-is — the backend already sanitizes
 * these to be user-facing only (Result_Renderer contract).
 */
export function ErrorNotice({ errors }: ErrorNoticeProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="error-notice" role="alert" aria-live="polite">
      <h3 className="error-notice__title">Some features are unavailable</h3>
      <ul className="error-notice__list">
        {errors.map((error, index) => (
          <li key={index} className="error-notice__item">
            {error}
          </li>
        ))}
      </ul>
    </div>
  );
}
