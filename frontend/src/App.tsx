import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UploadPage } from './pages/UploadPage';
import { ResultsPage } from './pages/ResultsPage';

/**
 * App — root component.
 *
 * Wraps the app in BrowserRouter and ErrorBoundary.
 * Routes:
 *   /         → UploadPage  (Requirement 8.1)
 *   /results  → ResultsPage (Requirement 8.3)
 *   *         → redirect to /
 */
export function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
