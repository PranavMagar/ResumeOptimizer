interface LoadingOverlayProps {
  isLoading: boolean;
}

export function LoadingOverlay({ isLoading }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label="Analyzing your resume"
    >
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
        <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 border-r-fuchsia-500 border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute inset-3 rounded-full border-4 border-t-transparent border-r-transparent border-b-pink-500 border-l-violet-500 animate-spin-slow" style={{ animationDirection: 'reverse' }} />
      </div>
      <p className="text-slate-200 font-semibold text-lg">Analyzing your resume…</p>
      <p className="text-slate-500 text-sm mt-1">This may take a few seconds</p>
    </div>
  );
}
