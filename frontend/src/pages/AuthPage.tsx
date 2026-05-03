import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AuthPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (mode === 'signup' && !name) { setError('Please enter your name.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
      navigate('/upload');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 -left-60 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-60 -right-60 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-3xl">✦</span>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              AI Resume Optimizer
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            {mode === 'login' ? 'Welcome back — sign in to continue' : 'Create your account to get started'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          {/* Tab switcher */}
          <div className="flex bg-slate-800/60 rounded-xl p-1 mb-6">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === m
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
                <span className="text-red-400 text-sm">⚠</span>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-semibold text-base tracking-wide transition-all duration-200 mt-2
                ${loading
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.98]'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </span>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
