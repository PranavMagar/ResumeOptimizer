import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import fc from 'fast-check';
import { IssuesList } from './IssuesList';

/**
 * Feature: ai-resume-optimizer
 * Property 18: Issues and Suggestions Are Fully Rendered
 *
 * For any ApiResponse containing N issues and N suggestions, the IssuesList
 * component SHALL render exactly N issue-suggestion pairs, with each issue
 * text and its corresponding suggestion text visible in the DOM.
 *
 * Validates: Requirement 8.4
 */
describe('IssuesList', () => {
  // ── Property 18: Issues and suggestions are fully rendered ────────────────

  it('renders exactly N issue-suggestion pairs for any N', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
          { minLength: 1, maxLength: 10 },
        ),
        (items) => {
          const issues = items.map((s) => `Issue: ${s.trim()}`);
          const suggestions = items.map((s) => `Suggestion: ${s.trim()}`);

          const { unmount, container } = render(
            <IssuesList issues={issues} suggestions={suggestions} />,
          );
          const scope = within(container);

          // Each issue text must be visible within this render's container
          for (const issue of issues) {
            expect(scope.getAllByText(issue).length).toBeGreaterThan(0);
          }

          // Each suggestion text must be visible within this render's container
          for (const suggestion of suggestions) {
            expect(scope.getAllByText(suggestion).length).toBeGreaterThan(0);
          }

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });

  // ── Specific cases ────────────────────────────────────────────────────────

  it('renders empty state message when issues array is empty', () => {
    render(<IssuesList issues={[]} suggestions={[]} />);
    expect(screen.getByText(/no issues found/i)).toBeTruthy();
  });

  it('renders a single issue-suggestion pair', () => {
    render(
      <IssuesList
        issues={['Summary section is missing']}
        suggestions={['Add a 2–3 line professional summary']}
      />,
    );
    expect(screen.getByText('Summary section is missing')).toBeTruthy();
    expect(screen.getByText('Add a 2–3 line professional summary')).toBeTruthy();
  });

  it('renders multiple issue-suggestion pairs', () => {
    const issues = [
      'Summary section is missing',
      '3 bullet points use weak action verbs',
      'Resume has low keyword density',
    ];
    const suggestions = [
      'Add a professional summary',
      'Rewrite bullets with strong verbs',
      'Add relevant keywords',
    ];

    render(<IssuesList issues={issues} suggestions={suggestions} />);

    for (let i = 0; i < issues.length; i++) {
      expect(screen.getByText(issues[i])).toBeTruthy();
      expect(screen.getByText(suggestions[i])).toBeTruthy();
    }
  });

  it('renders the issues list with correct aria-label', () => {
    render(
      <IssuesList
        issues={['Test issue']}
        suggestions={['Test suggestion']}
      />,
    );
    expect(screen.getByRole('region', { name: /issues and suggestions/i })).toBeTruthy();
  });
});
