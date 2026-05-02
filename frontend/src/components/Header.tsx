export function Header() {
  return (
    <header className="text-center py-10 px-4">
      <div className="inline-flex items-center gap-2 mb-3">
        <span className="text-3xl">✦</span>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
          AI Resume Optimizer
        </h1>
      </div>
      <p className="text-slate-400 text-base max-w-md mx-auto leading-relaxed">
        Upload your resume and get an ATS score, actionable suggestions, and
        AI-rewritten content in seconds.
      </p>
    </header>
  );
}
