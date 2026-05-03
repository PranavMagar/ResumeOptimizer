import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UploadZone } from '../components/UploadZone';
import { FilePreview } from '../components/FilePreview';
import { ErrorBanner } from '../components/ErrorBanner';

export function UploadPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleFileSelect(file: File) {
    setSelectedFile(file);
    setValidationError(null);
  }

  function handleFileError(message: string) {
    setSelectedFile(null);
    setValidationError(message);
  }

  function handleContinue() {
    if (!selectedFile) return;
    navigate('/job-level', { state: { file: selectedFile } });
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="text-xl">✦</span>
          <span className="font-extrabold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            AI Resume Optimizer
          </span>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-slate-400 text-sm hidden sm:block">{user.name}</span>
            <button
              onClick={logout}
              className="text-slate-500 text-xs hover:text-slate-300 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        )}
      </nav>

      <div className="relative z-10 flex flex-col flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Heading */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-200">
              {user ? `Welcome back, ${user.name.split(' ')[0]} 👋` : 'Upload Your Resume'}
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Upload your resume and we'll score it against ATS criteria in seconds.
            </p>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {['Upload', 'Job Level', 'Analysis', 'Results'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 ${i === 0 ? 'text-violet-400' : 'text-slate-600'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${i === 0 ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/50' : 'bg-slate-800 text-slate-600'}`}>
                    {i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${i === 0 ? 'text-violet-400' : 'text-slate-600'}`}>
                    {step}
                  </span>
                </div>
                {i < 3 && <div className="w-6 h-px bg-slate-800" />}
              </div>
            ))}
          </div>

          <main className="space-y-4">
            <UploadZone
              onFileSelect={handleFileSelect}
              onError={handleFileError}
              disabled={false}
            />

            {selectedFile && <FilePreview file={selectedFile} />}
            {validationError && <ErrorBanner message={validationError} />}

            <button
              onClick={handleContinue}
              disabled={!selectedFile}
              className={`w-full py-3.5 rounded-xl font-semibold text-base tracking-wide transition-all duration-200
                ${selectedFile
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
            >
              Continue →
            </button>
          </main>
        </div>
      </div>
    </div>
  );
}
