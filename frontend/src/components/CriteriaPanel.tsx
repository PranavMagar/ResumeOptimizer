import { ApiResponse, SectionName } from '../types/api';

interface CriteriaPanelProps {
  result: ApiResponse;
}

interface CriterionRowProps {
  label: string;
  passed: boolean;
  score: number;
  maxScore: number;
  detail?: string;
}

function CriterionRow({ label, passed, score, maxScore, detail }: CriterionRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-800/60 last:border-0">
      {/* Pass/fail icon */}
      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5
        ${passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
        {passed ? '✓' : '✗'}
      </div>

      {/* Label + detail */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${passed ? 'text-slate-200' : 'text-slate-400'}`}>
          {label}
        </p>
        {detail && (
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{detail}</p>
        )}
      </div>

      {/* Score pill */}
      <div className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full
        ${passed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
        {score}/{maxScore}
      </div>
    </div>
  );
}

const SECTION_LABELS: Record<SectionName, string> = {
  contact: 'Contact Info',
  summary: 'Professional Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills Section',
};

export function CriteriaPanel({ result }: CriteriaPanelProps) {
  const { criteria, score } = result;

  if (!criteria) return null;

  const { breakdown, detectedSections, missingSections, weakBullets, keywordDensityScore, clarityIssues } = criteria;

  const totalBullets = weakBullets.length + (breakdown.bullets === 25 ? 1 : 0);
  const keywordPct = Math.round(keywordDensityScore * 100);

  // Overall color
  const scoreColor = score >= 75 ? 'text-violet-400' : score >= 50 ? 'text-amber-400' : 'text-red-400';
  const scoreRingColor = score >= 75 ? 'stroke-violet-500' : score >= 50 ? 'stroke-amber-500' : 'stroke-red-500';
  const circumference = 2 * Math.PI * 36;
  const progress = (score / 100) * circumference;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 flex-shrink-0">
        <span className="text-lg">📊</span>
        <span className="text-slate-300 font-medium text-sm">ATS Criteria Scorecard</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* Score summary */}
        <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          {/* Mini arc gauge */}
          <div className="relative flex-shrink-0">
            <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
              <circle cx="44" cy="44" r="36" fill="none" stroke="#1e293b" strokeWidth="8" />
              <circle
                cx="44" cy="44" r="36" fill="none"
                className={scoreRingColor}
                strokeWidth="8"
                strokeDasharray={`${progress} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(-90 44 44)"
                style={{ filter: `drop-shadow(0 0 4px currentColor)` }}
              />
              <text x="44" y="48" textAnchor="middle" fill="white" fontSize="18" fontWeight="800" fontFamily="Inter,sans-serif">
                {score}
              </text>
            </svg>
          </div>
          <div>
            <p className={`text-2xl font-extrabold ${scoreColor}`}>{score}/100</p>
            <p className="text-slate-400 text-sm">
              {score >= 75 ? 'Excellent — ATS ready' : score >= 50 ? 'Good — minor improvements needed' : 'Needs improvement'}
            </p>
            <p className="text-slate-600 text-xs mt-1">{detectedSections.length}/5 sections detected</p>
          </div>
        </div>

        {/* Criteria list */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl px-4 divide-y divide-slate-800/40">

          {/* 1. Resume Sections (5 individual rows) */}
          {(['contact', 'summary', 'experience', 'education', 'skills'] as SectionName[]).map((section) => {
            const detected = detectedSections.includes(section);
            return (
              <CriterionRow
                key={section}
                label={SECTION_LABELS[section]}
                passed={detected}
                score={detected ? 5 : 0}
                maxScore={5}
                detail={detected ? 'Section detected' : `Missing — add a ${SECTION_LABELS[section]} section`}
              />
            );
          })}

          {/* 2. Keyword Density */}
          <CriterionRow
            label="Keyword Density"
            passed={keywordDensityScore >= 0.5}
            score={breakdown.keywords}
            maxScore={20}
            detail={`${keywordPct}% of ATS keyword threshold${keywordDensityScore < 0.5 ? ' — add more industry-relevant terms' : ''}`}
          />

          {/* 3. Bullet Quality */}
          <CriterionRow
            label="Bullet Point Quality"
            passed={weakBullets.length === 0}
            score={breakdown.bullets}
            maxScore={25}
            detail={weakBullets.length === 0
              ? 'All bullets use strong action verbs'
              : `${weakBullets.length} weak bullet${weakBullets.length > 1 ? 's' : ''} — replace passive verbs with strong action verbs`}
          />

          {/* 4. Clarity */}
          <CriterionRow
            label="Sentence Clarity"
            passed={clarityIssues.length === 0}
            score={breakdown.clarity}
            maxScore={15}
            detail={clarityIssues.length === 0
              ? 'All sentences are concise'
              : `${clarityIssues.length} sentence${clarityIssues.length > 1 ? 's' : ''} exceed 30 words — break them into shorter statements`}
          />

          {/* 5. Education & Contact */}
          <CriterionRow
            label="Education & Contact"
            passed={breakdown.educationContact >= 10}
            score={breakdown.educationContact}
            maxScore={15}
            detail={
              breakdown.educationContact === 15
                ? 'Both education and contact info present'
                : breakdown.educationContact === 7
                  ? 'Only one of education/contact detected'
                  : 'Both education and contact sections missing'
            }
          />
        </div>

        {/* Score breakdown bar chart */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Score Breakdown</p>
          {[
            { label: 'Structure', value: breakdown.structure, max: 25, color: 'bg-violet-500' },
            { label: 'Keywords', value: breakdown.keywords, max: 20, color: 'bg-fuchsia-500' },
            { label: 'Bullets', value: breakdown.bullets, max: 25, color: 'bg-pink-500' },
            { label: 'Edu & Contact', value: breakdown.educationContact, max: 15, color: 'bg-amber-500' },
            { label: 'Clarity', value: breakdown.clarity, max: 15, color: 'bg-emerald-500' },
          ].map(({ label, value, max, color }) => (
            <div key={label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{label}</span>
                <span className="text-slate-500">{value}/{max}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full transition-all duration-700`}
                  style={{ width: `${(value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Weak bullets detail */}
        {weakBullets.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Weak Bullets Detected</p>
            <ul className="space-y-1.5">
              {weakBullets.slice(0, 5).map((bullet: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="text-red-400 flex-shrink-0 mt-0.5">✗</span>
                  <span className="line-clamp-2">{bullet}</span>
                </li>
              ))}
              {weakBullets.length > 5 && (
                <li className="text-xs text-slate-600">+{weakBullets.length - 5} more…</li>
              )}
            </ul>
          </div>
        )}

        {/* Missing sections detail */}
        {missingSections.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Missing Sections</p>
            <div className="flex flex-wrap gap-2">
              {missingSections.map((s: SectionName) => (
                <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                  {SECTION_LABELS[s]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          className="w-full py-3 rounded-xl font-semibold text-sm border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200"
        >
          ← Analyze Another Resume
        </button>
      </div>
    </div>
  );
}
