interface SubmitButtonProps {
  disabled: boolean;
  isLoading: boolean;
  onClick: () => void;
}

/**
 * SubmitButton — triggers the resume analysis API call.
 *
 * Disabled until a valid file is selected and not currently loading.
 * Requirement 8.2: Shows loading state while processing.
 */
export function SubmitButton({ disabled, isLoading, onClick }: SubmitButtonProps) {
  return (
    <button
      className="submit-button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-label={isLoading ? 'Analyzing resume…' : 'Analyze Resume'}
    >
      {isLoading ? 'Analyzing…' : 'Analyze Resume'}
    </button>
  );
}
