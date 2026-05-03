import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { useResume } from '../context/ResumeContext';
import { FileSearch, Brain, Sparkles, CheckCircle2, Loader2, Target } from 'lucide-react';
import { AnalysisResult } from '../context/ResumeContext';

const STAGES = [
  { id: 'parse', label: 'Parsing document', desc: 'Extracting text & structure', icon: FileSearch },
  { id: 'match', label: 'Matching profession', desc: 'Calibrating to your target role', icon: Target },
  { id: 'analyze', label: 'Analyzing sections', desc: 'Detecting keywords & gaps', icon: Brain },
  { id: 'rewrite', label: 'Generating rewrites', desc: 'Crafting polished suggestions', icon: Sparkles },
];

const STAGE_MS = 1000;

export function AnalyzingPage() {
  const nav = useNavigate();
  const { file, jobLevel, profession, targetRole, jobDescription, setResult } = useResume();
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (!file) { nav('/upload'); return; }

    const apiPromise = (async (): Promise<AnalysisResult> => {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobLevel', jobLevel);
      formData.append('profession', profession);
      if (targetRole) formData.append('targetRole', targetRole);
      if (jobDescription) formData.append('jobDescription', jobDescription);
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? 'Analysis failed'); }
      return res.json();
    })();

    const tick = setInterval(() => setProgress((p) => Math.min(95, p + 1.5)), (STAGE_MS * STAGES.length) / 100);
    const stageTimer = setInterval(() => {
      setStage((s) => { if (s < STAGES.length - 1) return s + 1; clearInterval(stageTimer); return s; });
    }, STAGE_MS);

    const minDelay = new Promise<void>((r) => setTimeout(r, STAGE_MS * STAGES.length));

    Promise.all([apiPromise, minDelay])
      .then(([data]) => {
        if (done.current) return;
        done.current = true;
        setResult(data);
        setProgress(100);
        setTimeout(() => nav('/results'), 300);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      });

    return () => { clearInterval(tick); clearInterval(stageTimer); };
  }, []);

  if (!file) return null;

  return (
    <PageShell hideNav>
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {error ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">⚠️</div>
            <h2 className="font-display text-2xl font-bold">Analysis Failed</h2>
            <p className="text-muted-foreground text-sm max-w-sm">{error}</p>
            <button onClick={() => nav('/upload')} className="mt-4 px-6 py-3 rounded-xl bg-gradient-primary text-white font-semibold hover:opacity-90 transition">
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="relative w-64 h-80 mb-10">
              <div className="absolute -inset-8 bg-gradient-primary opacity-20 blur-3xl rounded-full animate-pulse" />
              <div className="relative w-full h-full rounded-2xl surface overflow-hidden">
                <div className="p-6 space-y-3">
                  <div className="h-3 w-3/4 rounded bg-gradient-primary animate-shimmer bg-[length:200%_100%]" />
                  <div className="h-2 w-1/2 rounded bg-muted" />
                  <div className="pt-3 space-y-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="h-2 rounded bg-muted" style={{ width: `${50 + ((i * 17) % 45)}%` }} />
                    ))}
                  </div>
                  <div className="pt-3 space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-2 rounded bg-muted" style={{ width: `${40 + ((i * 23) % 50)}%` }} />
                    ))}
                  </div>
                </div>
                <div className="absolute inset-x-0 h-20 bg-gradient-to-b from-transparent via-primary/25 to-transparent animate-scan pointer-events-none" />
                <div className="absolute inset-x-0 h-[2px] bg-primary shadow-glow animate-scan pointer-events-none" />
                {['top-2 left-2 border-t-2 border-l-2', 'top-2 right-2 border-t-2 border-r-2', 'bottom-2 left-2 border-b-2 border-l-2', 'bottom-2 right-2 border-b-2 border-r-2'].map((c) => (
                  <div key={c} className={`absolute w-5 h-5 border-primary ${c}`} />
                ))}
              </div>
            </div>

            <div className="text-center max-w-xl space-y-2 mb-8">
              <h2 className="font-display text-3xl lg:text-4xl font-bold tracking-tight">
                <span className="gradient-text">Analyzing</span> your resume…
              </h2>
              <p className="text-muted-foreground">Tailoring insights for your profession and target role.</p>
            </div>

            <div className="w-full max-w-xl space-y-2 mb-8">
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-gradient-primary transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>{Math.round(progress)}%</span>
                <span className="truncate max-w-[60%]">{file?.name}</span>
              </div>
            </div>

            <ol className="w-full max-w-xl space-y-2">
              {STAGES.map((s, i) => {
                const isDone = i < stage;
                const isActive = i === stage;
                const Icon = s.icon;
                return (
                  <li key={s.id} className={`flex items-center gap-3 rounded-xl p-3 border transition-all duration-300 ${
                    isActive ? 'border-primary bg-primary/5' : isDone ? 'border-border opacity-70' : 'border-transparent opacity-50'
                  }`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isDone ? 'bg-success/15 text-success' : isActive ? 'bg-gradient-primary text-white' : 'bg-secondary text-muted-foreground'
                    }`}>
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{s.label}</div>
                      <div className="text-xs text-muted-foreground">{s.desc}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </section>
    </PageShell>
  );
}
