import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * ErrorBoundary — catches unexpected React render errors and displays a
 * generic fallback UI instead of crashing the entire app.
 *
 * Requirement 8.6: Frontend SHALL display user-friendly fallback messages
 * without exposing internal error details.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log to console server-side only — never expose to user
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <h2 className="error-boundary__title">Something went wrong</h2>
          <p className="error-boundary__message">
            An unexpected error occurred. Please refresh the page and try again.
          </p>
          <button
            className="error-boundary__button"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
