import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { UploadPage } from './pages/UploadPage';
import { JobLevelPage } from './pages/JobLevelPage';
import { AnalyzingPage } from './pages/AnalyzingPage';
import { ResultsPage } from './pages/ResultsPage';
import { ReactNode } from 'react';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/" replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/upload" replace /> : <AuthPage />} />
      <Route path="/upload" element={<RequireAuth><UploadPage /></RequireAuth>} />
      <Route path="/job-level" element={<RequireAuth><JobLevelPage /></RequireAuth>} />
      <Route path="/analyzing" element={<RequireAuth><AnalyzingPage /></RequireAuth>} />
      <Route path="/results" element={<RequireAuth><ResultsPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
