import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ResumeProvider } from './context/ResumeContext';
import { AuthPage } from './pages/AuthPage';
import { UploadPage } from './pages/UploadPage';
import { JobLevelPage } from './pages/JobLevelPage';
import { AnalyzingPage } from './pages/AnalyzingPage';
import { ResultsPage } from './pages/ResultsPage';

export function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ResumeProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/job-level" element={<JobLevelPage />} />
            <Route path="/analyzing" element={<AnalyzingPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </ResumeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
