import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { PageShell } from '../components/PageShell';
import { useResume } from '../context/ResumeContext';
import { Sparkles, Zap, Target, Wand2 } from 'lucide-react';

const FEATURES = [
  { icon: Target, title: 'ATS score', desc: 'Instant compatibility rating' },
  { icon: Zap, title: 'Real-time fixes', desc: 'Actionable suggestions in seconds' },
  { icon: Wand2, title: 'AI rewrites', desc: 'Polished bullets, ready to paste' },
];

export function AuthPage() {
  const nav = useNavigate();
  const { setUser } = useResume();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setUser({ name: name || email.split('@')[0] || 'Friend', email: email || 'guest@resumeai.app' });
    setLoading(false);
    nav('/upload');
  };

  return (
    <PageShell hideNav>
      <div className="min-h-screen grid lg:grid-cols-2">
        {/* Left: hero */}
        <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-40" />
          <div className="relative"><Logo to="/auth" /></div>
          <div className="relative space-y-6 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs">
              <Sparkles className="w-3.5 h-3.5 text-primary-glow" />
              <span>AI-powered resume optimization</span>
            </div>
            <h1 className="font-display text-5xl xl:text-6xl font-bold leading-[1.05] text-balance">
              Land more interviews with a <span className="gradient-text">smarter resume</span>.
            </h1>
            <p className="text-muted-foreground text-lg">
              Upload your resume and let AI score, fix, and rewrite it — in under 30 seconds.
            </p>
            <div className="grid gap-3 pt-2">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-center gap-3 glass rounded-xl px-4 py-3 animate-fade-in">
                  <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                    <f.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{f.title}</div>
                    <div className="text-xs text-muted-foreground">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative text-xs text-muted-foreground">Trusted by job seekers at top companies</div>
        </div>

        {/* Right: form */}
        <div className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md space-y-6 animate-scale-in">
            <div className="lg:hidden flex justify-center"><Logo to="/auth" /></div>
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="font-display text-3xl font-bold">
                {mode === 'signup' ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {mode === 'signup' ? 'No credit card. No spam. Just better resumes.' : 'Sign in to continue your scan.'}
              </p>
            </div>

            <div className="glass rounded-2xl p-6 space-y-4">
              <div className="flex p-1 rounded-xl bg-secondary/50 text-sm">
                {(['signup', 'signin'] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`flex-1 py-2 rounded-lg transition font-medium ${
                      mode === m ? 'bg-gradient-primary text-white shadow-glow' : 'text-muted-foreground hover:text-foreground'
                    }`}>
                    {m === 'signup' ? 'Sign up' : 'Sign in'}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Full name</label>
                    <input
                      placeholder="Ada Lovelace" value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <input type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-primary text-white font-semibold shadow-glow hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? (
                    <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Working…</>
                  ) : (
                    <>{mode === 'signup' ? 'Create account' : 'Sign in'} →</>
                  )}
                </button>
              </form>

              <button type="button" onClick={submit} className="w-full text-xs text-muted-foreground hover:text-foreground transition">
                or continue as guest
              </button>
            </div>
            <p className="text-xs text-center text-muted-foreground">By continuing you agree to our Terms & Privacy.</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
