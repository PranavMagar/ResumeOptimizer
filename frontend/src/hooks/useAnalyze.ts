import { useState } from 'react';
import { ApiResponse } from '../types/api';

/**
 * Custom hook for calling POST /api/analyze with a resume file.
 *
 * Encapsulates fetch logic, loading state, error handling, and result state.
 * The frontend SHALL NOT store the resume file or its contents in browser
 * local storage or session storage (Requirement 8.8).
 *
 * @returns { analyze, isLoading, error, result }
 */
export function useAnalyze() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);

  /**
   * Submits a resume file to the backend for analysis.
   *
   * @param file - The File object selected by the user
   */
  const analyze = async (file: File): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
        // Do NOT set Content-Type header — browser sets it with boundary for multipart
      });

      if (!response.ok) {
        // Non-200 response — extract error message from body
        const errorData = await response.json();
        throw new Error(errorData.error ?? 'An error occurred. Please try again.');
      }

      const data: ApiResponse = await response.json();
      setResult(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { analyze, isLoading, error, result };
}
