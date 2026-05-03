import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export type JobLevel = 'internship' | 'entry' | 'mid' | 'senior' | 'executive';

interface JobLevelOption {
  id: JobLevel;
  label: string;
  sublabel: string;
  icon: string;
  years: string;
  color: string;
  ring: string;
}

const JOB_LEVELS: JobLevelOption[] = [
  {
    id: 'internship',
    label: 'Internship',
    sublabel: 'Student or recent grad seeking internship',
    icon: '🎓',
    years: '0 years exp.',
    color: 'from-sky-500/20 to-sky-600/5',
    ring: 'border-sky-500/50',
  },
  {
    id: 'entry',
    label: 'Entry Level',
    sublabel: 'Just starting out in your career',
    icon: '🌱',
    years: '0–2 years exp.',
    color: 'from-emerald-500/20 to-emerald-600/5',
    ring: 'border-emerald-500/50',
  },
  {
    id: 'mid',
    label: 'Mid Level',
    sublabel: 'Established professional growing your career',
    icon: '⚡',
    years: '3–6 years exp.',
    color: 'from-violet-500/20 to-violet-600/5',
    ring: 'border-violet-500/50',
  },
  {
    id: 'senior',
    label: 'Senior Level',
    sublabel: 'Experienced professional or team lead',
    icon: '🚀',
    years: '7–12 years exp.',
    color: 'from-fuchsia-500/20 to-fuchsia-600/5',
    ring: 'border-fuchsia-500/50',
  },
  {
    id: 'executive',
    label: 'Executive',
    sublabel: 'Director, VP, C-suite or equivalent',
    icon: '👑',
    years: '12+ years exp.',
    color: 'from-amber-500/20 to-amber-600/5',
    ring: 'border-amber-500/50',
  },
];

interface LocationState {
  file: File;
}

export function JobLevelPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const file = state?.file;

  const [selected, setSelected] = useState<JobLevel | null>(null);

  if (!file) {
    navigate('/upload', { replace: true });
    return null;
  }

  function handleContinue() {
    if (!selected || !file) return;
    navigate('/analyzing', { state: { file, jobLevel: selected } });
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-10">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-2xl">✦</span>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              AI Resume Optimizer
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-200 mt-2">What level are you targeting?</h2>
          <p className="text-slate-400 text-sm mt-1">
            We'll tailor the analysis criteria to match your career stage.
          </p>
        </div>

        {/* Level cards */}
        <div className="space-y-3">
          {JOB_LEVELS.map((level) => {
            const isSelected = selected === level.id;
            return (
              <button
                key={level.id}
                onClick={() => setSelected(level.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left
                  bg-gradient-to-r ${level.color}
                  ${isSelected
                    ? `${level.ring} scale-[1.01] shadow-lg`
                    : 'border-slate-800 hover:border-slate-600'
                  }`}
              >
                <div className="text-3xl flex-shrink-0">{level.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-slate-200 font-semibold">{level.label}</p>
                    <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">
                      {level.years}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-0.5">{level.sublabel}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                  ${isSelected ? `${level.ring} bg-gradient-to-br ${level.color}` : 'border-slate-700'}`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!selected}
          className={`w-full mt-6 py-3.5 rounded-xl font-semibold text-base tracking-wide transition-all duration-200
            ${selected
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.98]'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
        >
          Analyze My Resume →
        </button>

        <button
          onClick={() => navigate('/upload')}
          className="w-full mt-3 py-2.5 text-slate-500 text-sm hover:text-slate-300 transition-colors"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
