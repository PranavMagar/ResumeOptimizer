import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { UploadZone } from '../components/UploadZone';
import { FilePreview } from '../components/FilePreview';
import { SubmitButton } from '../components/SubmitButton';
import { ErrorBanner } from '../components/ErrorBanner';
import { LoadingOverlay } from '../components/LoadingOverlay';

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
      navigate('/results', { state: { result: data } });
    } catch {
      setValidationError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <Header />

          <main className="space-y-4 mt-2">
            <UploadZone
              onFileSelect={handleFileSelect}
              onError={handleFileError}
              disabled={isLoading}
            />

            {selectedFile && <FilePreview file={selectedFile} />}
            {validationError && <ErrorBanner message={validationError} />}

            <SubmitButton
              disabled={!selectedFile}
              isLoading={isLoading}
              onClick={handleAnalyze}
            />
          </main>
        </div>
      </div>

      <LoadingOverlay isLoading={isLoading} />
    </div>
  );
}
