import { useState } from 'react';
import { ApiResponse } from '../types/api';

interface RewritePanelProps {
  rewrites: ApiResponse['rewrites'];
}

interface PanelProps {
  title: string;
  content: string | string[];
}

/**
 * Individual collapsible panel for a single rewrite section.
 * Keyboard-navigable via button element.
 */
function Panel({ title, content }: PanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const panelId = `rewrite-panel-${title.toLowerCase().replace(/\s+/g, '-')}`;

  async function handleCopy() {
    const text = Array.isArray(content) ? content.join('\n') : content;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API may not be available in all environments — fail silently
    }
  }

  return (
    <div className="rewrite-panel__section">
      <div className="rewrite-panel__header">
        <button
          className="rewrite-panel__toggle"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <span className="rewrite-panel__title">{title}</span>
          <span className="rewrite-panel__chevron" aria-hidden="true">
            {isOpen ? '▲' : '▼'}
          </span>
        </button>
        <button
          className="rewrite-panel__copy"
          onClick={handleCopy}
          aria-label={`Copy ${title} rewrite`}
        >
          Copy
        </button>
      </div>

      {isOpen && (
        <div id={panelId} className="rewrite-panel__content">
          {Array.isArray(content) ? (
            <ul className="rewrite-panel__list">
              {content.map((item, i) => (
                <li key={i} className="rewrite-panel__list-item">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rewrite-panel__text">{content}</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * RewritePanel — collapsible panels per rewrite section.
 *
 * Renders exactly K labeled panels where K = number of keys in rewrites.
 * Each panel has a "Copy" button using navigator.clipboard.writeText.
 * Keyboard-navigable via button elements.
 *
 * Requirement 8.5, Design Property 19.
 */
export function RewritePanel({ rewrites }: RewritePanelProps) {
  const hasSummary = Boolean(rewrites.summary);
  const hasExperience = Boolean(rewrites.experience?.length);

  if (!hasSummary && !hasExperience) return null;

  return (
    <section className="rewrite-panel" aria-label="AI-rewritten content">
      <h2 className="rewrite-panel__heading">AI-Rewritten Content</h2>

      {hasSummary && rewrites.summary && (
        <Panel title="Professional Summary" content={rewrites.summary} />
      )}

      {hasExperience && rewrites.experience && (
        <Panel title="Experience Bullets" content={rewrites.experience} />
      )}
    </section>
  );
}
