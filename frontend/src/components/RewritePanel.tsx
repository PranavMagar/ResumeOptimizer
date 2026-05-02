import { useState } from 'react';
import { ApiResponse } from '../types/api';

interface RewritePanelProps {
  rewrites: ApiResponse['rewrites'];
}

interface PanelProps {
  title: string;
  content: string | string[];
}

function Panel({ title, content }: PanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const panelId = `rewrite-panel-${title.toLowerCase().replace(/\s+/g, '-')}`;

  async function handleCopy() {
    const text = Array.isArray(content) ? content.join('\n') : content;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fail silently
    }
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60">
        <button
          className="flex items-center gap-2 text-left flex-1"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <span className="text-violet-400 text-sm font-semibold">{title}</span>
          <span className="text-slate-500 text-xs ml-auto mr-2">{isOpen ? '▲' : '▼'}</span>
        </button>
        <button
          onClick={handleCopy}
          aria-label={`Copy ${title} rewrite`}
          className={`text-xs font-medium px-3 py-1 rounded-lg transition-all duration-200 ${
            copied
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
          }`}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      {isOpen && (
        <div id={panelId} className="px-4 py-3">
          {Array.isArray(content) ? (
            <ul className="space-y-2">
              {content.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-300 text-sm leading-relaxed">
                  <span className="text-violet-500 mt-1 flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-300 text-sm leading-relaxed">{content}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function RewritePanel({ rewrites }: RewritePanelProps) {
  const hasSummary = Boolean(rewrites.summary);
  const hasExperience = Boolean(rewrites.experience?.length);

  if (!hasSummary && !hasExperience) return null;

  return (
    <section aria-label="AI-rewritten content" className="space-y-3">
      <h2 className="text-lg font-bold text-slate-200">AI-Rewritten Content</h2>
      {hasSummary && rewrites.summary && (
        <Panel title="Professional Summary" content={rewrites.summary} />
      )}
      {hasExperience && rewrites.experience && (
        <Panel title="Experience Bullets" content={rewrites.experience} />
      )}
    </section>
  );
}
