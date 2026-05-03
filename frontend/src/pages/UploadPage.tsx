import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { useResume } from '../context/ResumeContext';
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react';

const ACCEPTED = ['.pdf', '.docx'];
const MAX_MB = 5;

export function UploadPage() {
  const nav = useNavigate();
  const { file, setFile } = useResume();
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (f: File) => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED.includes(ext)) return `File type not supported. Use ${ACCEPTED.join(', ')}.`;
    if (f.size > MAX_MB * 1024 * 1024) return `File too large. Max ${MAX_MB} MB.`;
    return null;
  };

  const onFile = useCallback((f: File) => {
    const err = validate(f);
    if (err) { setError(err); return; }
    setError(null);
    setFile(f);
  }, [setFile]);

  return (
    <PageShell>
      <section className="container max-w-4xl py-12 lg:py-20">
        <div className="text-center space-y-4 mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>Step 1 of 4 · Upload your resume</span>
          </div>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-balance">
            Let's <span className="gradient-text">optimize</span> your resume
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Drop your resume below. We'll never store it — analysis runs in-memory and disappears after your session.
          </p>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
          className={`relative rounded-3xl p-10 lg:p-16 text-center transition-all duration-300 ${drag ? 'scale-[1.01]' : ''}`}
        >
          <div className={`absolute inset-0 rounded-3xl gradient-border ${drag ? 'animate-pulse-glow' : ''}`} />
          <div className="relative space-y-5">
            {!file ? (
              <>
                <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow animate-float">
                  <Upload className="w-9 h-9 text-white" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-semibold">Drag & drop your resume</h3>
                  <p className="text-muted-foreground mt-1">PDF or DOCX · up to {MAX_MB} MB</p>
                </div>
                <div>
                  <label>
                    <input type="file" accept={ACCEPTED.join(',')} className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
                    <span className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-primary text-white font-semibold cursor-pointer hover:opacity-90 transition shadow-glow">
                      Browse files
                    </span>
                  </label>
                </div>
                {error && <p className="text-destructive text-sm animate-fade-in">{error}</p>}
              </>
            ) : (
              <div className="animate-scale-in space-y-5">
                <div className="mx-auto w-20 h-20 rounded-2xl bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <div className="glass rounded-xl p-4 flex items-center gap-3 max-w-md mx-auto">
                  <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium truncate">{file.name}</div>
                    <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <button onClick={() => setFile(null)} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <button onClick={() => nav('/profession')}
                  className="inline-flex items-center px-8 py-3 rounded-xl bg-gradient-primary text-white font-semibold shadow-glow hover:opacity-90 transition">
                  Continue →
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-10 text-center">
          {[{ v: '30s', l: 'average scan' }, { v: '100%', l: 'private' }, { v: '0$', l: 'to start' }].map((s) => (
            <div key={s.l} className="glass rounded-xl p-4">
              <div className="font-display text-2xl font-bold gradient-text">{s.v}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
