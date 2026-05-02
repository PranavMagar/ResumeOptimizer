import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { ScoreGauge } from '../components/ScoreGauge';
import { IssuesList } from '../components/IssuesList';
import { RewritePanel } from '../components/RewritePanel';
import { ErrorNotice } from '../components/ErrorNotice';
import { ApiResponse } from '../types/api';

interface LocationState {
  result: ApiResponse;
}

/**
 * ResultsPage — displays the full resume analysis output.
 *
 * Reads ApiResponse from React Router location state.
 * Redirects to / if no state is present (direct navigation guard).
 *
 * Requirements: 8.3, 8.4, 8.5, 8.6, 9.5
 */
export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as LocationState | null;
  const result = state?.result;

  // Redirect to upload page if no result in state (e.g. direct URL navigation)
  useEffect(() => {
    if (!result) {
      navigate('/', { replace: true });
    }
  }, [result, navigate]);

  if (!result) return null;

  return (
    <div className="results-page">
      <Header />

      <main className="results-page__main">
        {/* ATS Score — displayed prominently (Req 8.3) */}
        <section className="results-page__score" aria-label="ATS Score">
          <h2 className="results-page__score-title">Your ATS Score</h2>
          <ScoreGauge score={result.score} />
        </section>

        {/* Error notices — user-friendly, no technical details (Req 8.6, 9.5) */}
        {result.errors.length > 0 && (
          <ErrorNotice errors={result.errors} />
        )}

        {/* Issues and suggestions (Req 8.4) */}
        <IssuesList issues={result.issues} suggestions={result.suggestions} />

        {/* AI-rewritten content (Req 8.5) */}
        {(result.rewrites.summary || result.rewrites.experience?.length) && (
          <RewritePanel rewrites={result.rewrites} />
        )}

        {/* Analyze another resume */}
        <div className="results-page__actions">
          <button
            className="results-page__back-button"
            onClick={() => navigate('/')}
            aria-label="Analyze another resume"
          >
            Analyze Another Resume
          </button>
        </div>
      </main>
    </div>
  );
}
