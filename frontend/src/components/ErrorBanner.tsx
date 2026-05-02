import { useState } from 'react';

interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!message || dismissed) return null;

  return (
    <div
      className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 animate-fade-in"
      role="alert"
      aria-live="assertive"
    >
      <span className="text-red-400 text-lg flex-shrink-0 mt-0.5">⚠</span>
      <p className="text-red-300 text-sm flex-1">{message}</p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss error"
        className="text-red-400 hover:text-red-200 transition-colors flex-shrink-0 text-lg leading-none"
      >
        ✕
      </button>
    </div>
  );
}
