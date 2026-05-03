import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiResponse } from '../types/api';
import { ResumePreview } from '../components/ResumePreview';
import { CriteriaPanel } from '../components/CriteriaPanel';
import { RewritePanel } from '../components/RewritePanel';
import { ErrorNotice } from '../components/ErrorNotice';
import { JobLevel } from './JobLevelPage';

interface LocationState {
  result: ApiResponse;
  file: File;
  jobLevel: JobLevel;
}

const LEVEL_LABELS: Record<JobLevel, string> = {
  internship: 'Internship',
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior Level',
  executive: 'Executive',
};

export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as LocationState | null;
  const result = state?.result;
  const file = state?.file;
  const jobLevel = state?.jobLevel;

  useEffect(() => {
    if (!result) {
      navigate('/', { replace: true });
    }
  }, [result, navigate]);

  if (!result || !file) return null;

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-slate-800 flex-shrink-0 bg-slate-950/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">✦</span>
          <span className="font-extrabold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            AI Resume Optimizer
          </span>
          {jobLevel && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 ml-1">
              {LEVEL_LABELS[jobLevel]}
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
        >
          ← New Analysis
        </button>
      </header>

      {/* Split-screen body */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — Resume preview */}
        <div className="w-1/2 border-r border-slate-800 flex flex-col overflow-hidden bg-slate-900/30">
          <ResumePreview file={file} />
        </div>

        {/* RIGHT — Criteria scorecard + rewrites */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          {/* Error notice if any */}
          {result.errors.length > 0 && (
            <div className="px-4 pt-3 flex-shrink-0">
              <ErrorNotice errors={result.errors} />
            </div>
          )}

          {/* Criteria panel — scrollable */}
          <div className="flex-1 overflow-hidden">
            <CriteriaPanel result={result} />
          </div>
        </div>
      </div>

      {/* Bottom drawer for AI rewrites (if available) */}
      {(result.rewrites.summary || result.rewrites.experience?.length) && (
        <div className="border-t border-slate-800 bg-slate-900/60 px-6 py-4 flex-shrink-0 max-h-64 overflow-y-auto">
          <RewritePanel rewrites={result.rewrites} />
        </div>
      )}
    </div>
  );
}
