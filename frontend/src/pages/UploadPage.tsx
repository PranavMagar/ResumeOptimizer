import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { UploadZone } from '../components/UploadZone';
import { FilePreview } from '../components/FilePreview';
import { SubmitButton } from '../components/SubmitButton';
import { ErrorBanner } from '../components/ErrorBanner';
import { LoadingOverlay } from '../components/LoadingOverlay';

/**
 * UploadPage — entry point of the application.
 *
 * Manages file selection, validation feedback, and submission.
 * On success, navigates to /results with the ApiResponse in router state.
 *
 * Requirements: 8.1, 8.2, 8.7, 8.8
 * - Accepts PDF/DOCX, rejects others client-side (8.1)
 * - Shows loading indicator while processing (8.2)
 * - Displays specific rejection reason on validation failure (8.7)
 * - Does NOT store file or contents in localStorage/sessionStorage (8.8)
 */
export function UploadPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleFileSelect(file: File) {
    setSelectedFile(file);
    setValidationError(null);
  }

  function handleFileError(message: string) {
    setSelectedFile(null);
    setValidationError(message);
  }

  async function handleAnalyze() {
    if (!selectedFile) return;

    setIsLoading(true);
    setValidationError(null);

    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setValidationError(errorData.error ?? 'An error occurred. Please try again.');
        return;
      }

      const data = await response.json();
      // Navigate to results with ApiResponse in router state (Req 8.3–8.5)
      navigate('/results', { state: { result: data } });
    } catch {
      setValidationError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const displayError = validationError;

  return (
    <div className="upload-page">
      <Header />

      <main className="upload-page__main">
        <UploadZone
          onFileSelect={handleFileSelect}
          onError={handleFileError}
          disabled={isLoading}
        />

        {selectedFile && <FilePreview file={selectedFile} />}

        {displayError && <ErrorBanner message={displayError} />}

        <SubmitButton
          disabled={!selectedFile}
          isLoading={isLoading}
          onClick={handleAnalyze}
        />
      </main>

      <LoadingOverlay isLoading={isLoading} />
    </div>
  );
}
