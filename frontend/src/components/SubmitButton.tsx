interface SubmitButtonProps {
  disabled: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export function SubmitButton({ disabled, isLoading, onClick }: SubmitButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-label={isLoading ? 'Analyzing resume…' : 'Analyze Resume'}
      className={`
        w-full py-3.5 rounded-xl font-semibold text-base tracking-wide
        transition-all duration-200
        ${disabled || isLoading
          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
          : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.98]'
        }
      `}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Analyzing…
        </span>
      ) : (
        'Analyze Resume'
      )}
    </button>
  );
}
