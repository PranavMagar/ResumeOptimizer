import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { useResume, Profession } from '../context/ResumeContext';
import { useEffect } from 'react';
import {
  Code2, BarChart3, Palette, Target, Megaphone, Handshake,
  Calculator, Users, Settings2, HeartPulse, GraduationCap, Headphones, Briefcase,
} from 'lucide-react';

const PROFESSIONS: { id: Profession; label: string; icon: typeof Code2 }[] = [
  { id: 'software', label: 'Software Eng', icon: Code2 },
  { id: 'data', label: 'Data / Analytics', icon: BarChart3 },
  { id: 'design', label: 'Design / UX', icon: Palette },
  { id: 'product', label: 'Product Mgmt', icon: Target },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'sales', label: 'Sales', icon: Handshake },
  { id: 'finance', label: 'Finance', icon: Calculator },
  { id: 'hr', label: 'HR / People', icon: Users },
  { id: 'operations', label: 'Operations', icon: Settings2 },
  { id: 'healthcare', label: 'Healthcare', icon: HeartPulse },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'customer', label: 'Customer Success', icon: Headphones },
  { id: 'other', label: 'Other', icon: Briefcase },
];

export function ProfessionPage() {
  const nav = useNavigate();
  const { file, profession, setProfession, targetRole, setTargetRole, jobDescription, setJobDescription } = useResume();

  useEffect(() => { if (!file) nav('/upload'); }, [file, nav]);

  return (
    <PageShell>
      <section className="container max-w-4xl py-12 lg:py-16">
        <div className="text-center space-y-3 mb-10 animate-fade-in">
          <span className="chip">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Step 2 of 4 · Your field
          </span>
          <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight">
            What role are you <span className="gradient-text">applying for</span>?
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We tailor scoring, keywords and rewrites to your profession and target role.
          </p>
        </div>

        <div className="surface p-6 space-y-6">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-3 block font-semibold">
              Profession
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {PROFESSIONS.map((p) => {
                const Icon = p.icon;
                const active = profession === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setProfession(p.id)}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-medium transition-all ${
                      active
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-border hover:border-primary/40 hover:bg-secondary/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Target role <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="role"
                placeholder="e.g. Senior Frontend Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
                Why this matters
              </label>
              <p className="text-sm text-muted-foreground">
                We'll check if your resume mentions this role and align suggestions accordingly.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="jd" className="text-sm font-medium">
              Job description <span className="text-muted-foreground">(optional, paste to match)</span>
            </label>
            <textarea
              id="jd"
              rows={6}
              placeholder="Paste the job description here for a personalized match score…"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Adding a JD unlocks a side-by-side keyword match score in your results.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-8">
          <button onClick={() => nav('/upload')} className="px-4 py-2 text-muted-foreground hover:text-foreground transition text-sm">
            ← Back
          </button>
          <button
            onClick={() => nav('/job-level')}
            className="px-8 py-3 rounded-xl bg-gradient-primary text-white font-semibold shadow-glow hover:opacity-90 transition"
          >
            Continue →
          </button>
        </div>
      </section>
    </PageShell>
  );
}
