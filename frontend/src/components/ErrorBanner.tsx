import { useState } from 'react';

interface ErrorBannerProps {
  message: string;
}

/**
 * ErrorBanner — displays client-side or server-side validation error messages.
 * Dismissible by the user.
 *
 * Requirement 8.7: Frontend SHALL display the specific rejection reason
 * returned by the Upload_Service.
 */
export function ErrorBanner({ message }: ErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!message || dismissed) return null;

  return (
    <div className="error-banner" role="alert" aria-live="assertive">
      <span className="error-banner__message">{message}</span>
      <button
        className="error-banner__dismiss"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss error"
      >
        ✕
      </button>
    </div>
  );
}
