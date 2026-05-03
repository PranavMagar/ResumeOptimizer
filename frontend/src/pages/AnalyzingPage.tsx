import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { useResume } from '../context/ResumeContext';
import { FileSearch, Brain, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { ApiResponse } from '../types/api';

const STAGES = [
  { id: 'parse', label: 'Parsing document', desc: 'Extracting text & structure', icon: FileSearch },
  { id: 'analyze', label: 'Analyzing sections', desc: 'Detecting keywords & gaps', icon: Brain },
  { id: 'score', label: 'Scoring ATS compatibility', desc: 'Comparing against best practices', icon: Sparkles },
  { id: 'rewrite', label: 'Generating rewrites', desc: 'Crafting polished suggestions', icon: Sparkles },
];

const STAGE_MS = 1100;

export function AnalyzingPage() {
  const nav = useNavigate();
  const { file, jobLevel, setResult } = useResume();
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (!file) { nav('/upload'); return; }

    // Start API call immediately
    const apiPromise = (async (): Promise<ApiResponse> => {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobLevel', jobLevel);
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? 'Analysis failed'); }
      return res.json();
    })();

    // Animate stages
    const stageTimer = setInterval(() => {
      setStage((s) => { if (s < STAGES.length - 1) return s + 1; clearInterval(stageTimer); return s; });
    }, STAGE_MS);

    const tickTimer = setInterval(() => {
      setProgress((p) => Math.min(95, p + 1.5));
    }, (STAGE_MS * STAGES.length) / 100);

    const minDelay = new Promise<void>((r) => setTimeout(r, STAGE_MS * STAGES.length));

    Promise.all([apiPromise, minDelay])
      .then(([data]) => {
        if (done.current) return;
        done.current = true;
        setResult(data);
        setProgress(100);
        setTimeout(() => nav('/results'), 400);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      });

    return () => { clearInterval(stageTimer); clearInterval(tickTimer); };
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
            {/* Document scan visual */}
            <div className="relative w-64 h-80 mb-10">
              <div className="absolute -inset-10 bg-gradient-primary opacity-25 blur-3xl rounded-full animate-pulse" />
              <div className="relative w-full h-full rounded-2xl glass-strong overflow-hidden">
                <div className="p-5 space-y-3">
                  <div className="h-3 w-3/4 rounded bg-gradient-to-r from-primary to-accent animate-shimmer bg-[length:200%_100%]" />
                  <div className="h-2 w-1/2 rounded bg-muted-foreground/20" />
                  <div className="pt-3 space-y-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="h-2 rounded bg-muted-foreground/15" style={{ width: `${50 + ((i * 17) % 45)}%` }} />
                    ))}
                  </div>
                  <div className="pt-3 space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-2 rounded bg-muted-foreground/15" style={{ width: `${40 + ((i * 23) % 50)}%` }} />
                    ))}
                  </div>
                </div>
                {/* Scan beam */}
                <div className="absolute inset-x-0 h-20 bg-gradient-to-b from-transparent via-primary/40 to-transparent animate-scan pointer-events-none" />
                <div className="absolute inset-x-0 h-[2px] bg-primary shadow-glow animate-scan pointer-events-none" />
                {/* Corner brackets */}
                {['top-2 left-2 border-t-2 border-l-2', 'top-2 right-2 border-t-2 border-r-2', 'bottom-2 left-2 border-b-2 border-l-2', 'bottom-2 right-2 border-b-2 border-r-2'].map((c) => (
                  <div key={c} className={`absolute w-5 h-5 border-primary ${c}`} />
                ))}
              </div>
              {/* Orbiting dots */}
              <div className="absolute inset-0 animate-spin-slow pointer-events-none">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent shadow-glow" />
                <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary-glow" />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary" />
              </div>
            </div>

            <div className="text-center max-w-xl space-y-3 mb-8">
              <h2 className="font-display text-3xl lg:text-4xl font-bold">
                <span className="gradient-text">Analyzing</span> your resume…
              </h2>
              <p className="text-muted-foreground">Our AI is reading every line. This usually takes ~30 seconds.</p>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xl space-y-2 mb-8">
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-gradient-primary transition-all duration-300 shadow-glow" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>{Math.round(progress)}%</span>
                <span>{file?.name}</span>
              </div>
            </div>

            {/* Stages */}
            <ol className="w-full max-w-xl space-y-2">
              {STAGES.map((s, i) => {
                const isDone = i < stage;
                const isActive = i === stage;
                const Icon = s.icon;
                return (
                  <li key={s.id} className={`flex items-center gap-3 rounded-xl p-3 transition-all duration-500 ${isActive ? 'glass-strong scale-[1.01]' : isDone ? 'opacity-60' : 'opacity-40'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isDone ? 'bg-success/20 text-success' : isActive ? 'bg-gradient-primary text-white animate-pulse-glow' : 'bg-secondary text-muted-foreground'
                    }`}>
                      {isDone ? <CheckCircle2 className="w-5 h-5" /> : isActive ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
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
