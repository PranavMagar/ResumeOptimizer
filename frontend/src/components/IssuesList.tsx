interface IssuesListProps {
  issues: string[];
  suggestions: string[];
}

/**
 * IssuesList — renders each issue with its corresponding suggestion as a card.
 *
 * Renders exactly N issue-suggestion pairs where N = issues.length.
 * Requirement 8.4, Design Property 18.
 */
export function IssuesList({ issues, suggestions }: IssuesListProps) {
  if (issues.length === 0) {
    return (
      <div className="issues-list issues-list--empty">
        <p>No issues found. Your resume looks great!</p>
      </div>
    );
  }

  return (
    <section className="issues-list" aria-label="Issues and suggestions">
      <h2 className="issues-list__title">Issues &amp; Suggestions</h2>
      <ul className="issues-list__items">
        {issues.map((issue, index) => (
          <li key={index} className="issues-list__item">
            <div className="issues-list__issue">
              <span className="issues-list__issue-icon" aria-hidden="true">⚠️</span>
              <span className="issues-list__issue-text">{issue}</span>
            </div>
            {suggestions[index] && (
              <div className="issues-list__suggestion">
                <span className="issues-list__suggestion-icon" aria-hidden="true">💡</span>
                <span className="issues-list__suggestion-text">{suggestions[index]}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
