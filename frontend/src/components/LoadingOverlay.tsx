/**
 * LoadingOverlay — full-screen spinner shown while the resume is being analyzed.
 *
 * Accessibility: aria-live="polite" announces the loading state to screen readers.
 * Requirement 8.2: Frontend SHALL display a loading indicator while processing.
 */
interface LoadingOverlayProps {
  isLoading: boolean;
}

export function LoadingOverlay({ isLoading }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div
      className="loading-overlay"
      role="status"
      aria-live="polite"
      aria-label="Analyzing your resume"
    >
      <div className="loading-overlay__spinner" aria-hidden="true" />
      <p className="loading-overlay__text">Analyzing your resume…</p>
    </div>
  );
}
