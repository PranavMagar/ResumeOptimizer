interface ErrorNoticeProps {
  errors: string[];
}

export function ErrorNotice({ errors }: ErrorNoticeProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div
      className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 space-y-1"
      role="alert"
      aria-live="polite"
    >
      <p className="text-amber-300 font-semibold text-sm">Some features are unavailable</p>
      <ul className="space-y-0.5">
        {errors.map((error, index) => (
          <li key={index} className="text-amber-400/80 text-sm">
            {error}
          </li>
        ))}
      </ul>
    </div>
  );
}
