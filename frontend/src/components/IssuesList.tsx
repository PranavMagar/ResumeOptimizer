interface IssuesListProps {
  issues: string[];
  suggestions: string[];
}

export function IssuesList({ issues, suggestions }: IssuesListProps) {
  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-5 py-4">
        <span className="text-2xl">🎉</span>
        <p className="text-emerald-300 font-medium">No issues found. Your resume looks great!</p>
      </div>
    );
  }

  return (
    <section aria-label="Issues and suggestions" className="space-y-3">
      <h2 className="text-lg font-bold text-slate-200">Issues &amp; Suggestions</h2>
      <ul className="space-y-3">
        {issues.map((issue, index) => (
          <li
            key={index}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2 animate-slide-up"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-amber-400 text-base flex-shrink-0 mt-0.5">⚠️</span>
              <p className="text-slate-300 text-sm leading-relaxed">{issue}</p>
            </div>
            {suggestions[index] && (
              <div className="flex items-start gap-2.5 pl-1 border-l-2 border-violet-500/40 ml-1">
                <span className="text-violet-400 text-base flex-shrink-0 mt-0.5">💡</span>
                <p className="text-slate-400 text-sm leading-relaxed">{suggestions[index]}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
