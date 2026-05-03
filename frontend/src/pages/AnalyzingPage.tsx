import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { JobLevel } from './JobLevelPage';
import { ApiResponse } from '../types/api';

interface LocationState {
  file: File;
  jobLevel: JobLevel;
}

const STEPS = [
  { id: 'upload',   label: 'Uploading resume',           icon: '📤', duration: 600 },
  { id: 'parse',    label: 'Extracting text content',    icon: '📖', duration: 900 },
  { id: 'sections', label: 'Detecting resume sections',  icon: '🔍', duration: 800 },
  { id: 'keywords', label: 'Scanning ATS keywords',      icon: '🎯', duration: 900 },
  { id: 'bullets',  label: 'Evaluating bullet quality',  icon: '✍️',  duration: 700 },
  { id: 'score',    label: 'Computing ATS score',        icon: '📊', duration: 800 },
  { id: 'ai',       label: 'Generating AI suggestions',  icon: '🤖', duration: 1000 },
  { id: 'done',     label: 'Finalizing results',         icon: '✅', duration: 500 },
];

const LEVEL_LABELS: Record<JobLevel, string> = {
  internship: 'Internship',
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior Level',
  executive: 'Executive',
};

export function AnalyzingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const file = state?.file;
  const jobLevel = state?.jobLevel;

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const apiCallMade = useRef(false);

  useEffect(() => {
    if (!file || !jobLevel) {
      navigate('/upload', { replace: true });
      return;
    }
    if (apiCallMade.current) return;
    apiCallMade.current = true;

    // Start the API call immediately in parallel with the animation
    const apiPromise = (async () => {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobLevel', jobLevel);
      const response = await fetch('/api/analyze', { method: 'POST', body: formData });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error ?? 'Analysis failed');
      }
      return response.json() as Promise<ApiResponse>;
    })();

    // Animate through steps
    let stepIndex = 0;
    const totalAnimationTime = STEPS.reduce((sum, s) => sum + s.duration, 0);

    function advanceStep() {
      if (stepIndex >= STEPS.length) return;
      setCurrentStep(stepIndex);
      const duration = STEPS[stepIndex].duration;
      setTimeout(() => {
        setCompletedSteps((prev) => new Set([...prev, stepIndex]));
        stepIndex++;
        if (stepIndex < STEPS.length) {
          advanceStep();
        }
      }, duration);
    }

    advanceStep();

    // Wait for both animation and API to finish
    const minDelay = new Promise((r) => setTimeout(r, totalAnimationTime + 400));

    Promise.all([apiPromise, minDelay])
      .then(([data]) => {
        navigate('/results', { state: { result: data, file, jobLevel } });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      });
  }, []);

  if (!file || !jobLevel) return null;

  const progress = ((completedSteps.size) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {error ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">⚠️</div>
            <h2 className="text-xl font-bold text-slate-200">Analysis Failed</h2>
            <p className="text-slate-400 text-sm">{error}</p>
            <button
              onClick={() => navigate('/upload')}
              className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold hover:from-violet-500 hover:to-fuchsia-500 transition-all"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Central spinner */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-28 h-28">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
                <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 border-r-fuchsia-500 border-b-transparent border-l-transparent animate-spin" />
                {/* Inner ring */}
                <div className="absolute inset-3 rounded-full border-4 border-t-transparent border-r-transparent border-b-pink-500 border-l-violet-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }} />
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center text-2xl">
                  {completedSteps.size === STEPS.length ? '✅' : STEPS[currentStep]?.icon}
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-200">Analyzing your resume</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Optimizing for <span className="text-violet-400 font-semibold">{LEVEL_LABELS[jobLevel]}</span> roles
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>{STEPS[Math.min(currentStep, STEPS.length - 1)]?.label}…</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Step list */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
              {STEPS.map((step, i) => {
                const isDone = completedSteps.has(i);
                const isActive = currentStep === i && !isDone;
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 py-1.5 transition-all duration-300 ${
                      isDone ? 'opacity-100' : isActive ? 'opacity-100' : 'opacity-30'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-all duration-300 ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isActive
                          ? 'bg-violet-500/20 text-violet-400'
                          : 'bg-slate-800 text-slate-600'
                    }`}>
                      {isDone ? '✓' : isActive ? (
                        <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                      ) : '·'}
                    </div>
                    <span className={`text-sm ${isDone ? 'text-slate-300' : isActive ? 'text-slate-200 font-medium' : 'text-slate-600'}`}>
                      {step.label}
                    </span>
                    {isActive && (
                      <span className="ml-auto">
                        <svg className="animate-spin h-3 w-3 text-violet-400" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
