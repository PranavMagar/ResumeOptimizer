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

export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as LocationState | null;
  const result = state?.result;

  useEffect(() => {
    if (!result) {
      navigate('/', { replace: true });
    }
  }, [result, navigate]);

  if (!result) return null;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        <Header />

        <main className="space-y-6 mt-2 animate-slide-up">
          {/* Score */}
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-bold text-slate-200 mb-4">Your ATS Score</h2>
            <ScoreGauge score={result.score} />
          </div>

          {/* Error notices */}
          {result.errors.length > 0 && (
            <ErrorNotice errors={result.errors} />
          )}

          {/* Issues & Suggestions */}
          <IssuesList issues={result.issues} suggestions={result.suggestions} />

          {/* AI Rewrites */}
          {(result.rewrites.summary || result.rewrites.experience?.length) && (
            <RewritePanel rewrites={result.rewrites} />
          )}

          {/* Back button */}
          <div className="pt-2 pb-8">
            <button
              onClick={() => navigate('/')}
              aria-label="Analyze another resume"
              className="w-full py-3.5 rounded-xl font-semibold text-base border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 active:scale-[0.98]"
            >
              ← Analyze Another Resume
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
