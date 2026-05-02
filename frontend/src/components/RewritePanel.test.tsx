import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';
import { RewritePanel } from './RewritePanel';
import { ApiResponse } from '../types/api';

/**
 * Feature: ai-resume-optimizer
 * Property 19: Rewrites Panel Renders All Sections
 *
 * For any rewrites object containing K section keys, the RewritePanel
 * component SHALL render exactly K labeled panels, each containing the
 * rewritten content for its section.
 *
 * Validates: Requirement 8.5
 */
describe('RewritePanel', () => {
  // ── Property 19: Rewrites panel renders all sections ──────────────────────

  it('renders a panel for summary when summary rewrite is present', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
        (summaryText) => {
          const rewrites: ApiResponse['rewrites'] = { summary: summaryText.trim() };
          const { unmount, getByText } = render(<RewritePanel rewrites={rewrites} />);

          // Panel heading must be present
          expect(getByText('Professional Summary')).toBeTruthy();
          // Content must be visible
          expect(getByText(summaryText.trim())).toBeTruthy();

          unmount();
        },
      ),
      { numRuns: 50 },
    );
  });

  it('renders a panel for experience bullets when experience rewrites are present', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          { minLength: 1, maxLength: 5 },
        ),
        (bullets) => {
          const trimmedBullets = bullets.map((b) => b.trim());
          const rewrites: ApiResponse['rewrites'] = { experience: trimmedBullets };
          const { unmount, getByText, getAllByText } = render(<RewritePanel rewrites={rewrites} />);

          // Panel heading must be present
          expect(getAllByText('Experience Bullets').length).toBeGreaterThan(0);
          // Each bullet must be visible
          for (const bullet of trimmedBullets) {
            expect(getByText(bullet)).toBeTruthy();
          }

          unmount();
        },
      ),
      { numRuns: 50 },
    );
  });

  // ── Specific cases ────────────────────────────────────────────────────────

  it('renders nothing when rewrites object is empty', () => {
    const { container } = render(<RewritePanel rewrites={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders both summary and experience panels when both are present', () => {
    const rewrites: ApiResponse['rewrites'] = {
      summary: 'Results-driven engineer with 5 years of experience.',
      experience: ['Led migration reducing deployment time by 40%.', 'Built REST APIs.'],
    };

    render(<RewritePanel rewrites={rewrites} />);

    expect(screen.getByText('Professional Summary')).toBeTruthy();
    expect(screen.getByText('Experience Bullets')).toBeTruthy();
    expect(screen.getByText('Results-driven engineer with 5 years of experience.')).toBeTruthy();
    expect(screen.getByText('Led migration reducing deployment time by 40%.')).toBeTruthy();
    expect(screen.getByText('Built REST APIs.')).toBeTruthy();
  });

  it('renders only summary panel when only summary is present', () => {
    const rewrites: ApiResponse['rewrites'] = {
      summary: 'Professional summary text.',
    };

    render(<RewritePanel rewrites={rewrites} />);

    expect(screen.getByText('Professional Summary')).toBeTruthy();
    expect(screen.queryByText('Experience Bullets')).toBeNull();
  });

  it('renders only experience panel when only experience is present', () => {
    const rewrites: ApiResponse['rewrites'] = {
      experience: ['Led team of 5 engineers.'],
    };

    render(<RewritePanel rewrites={rewrites} />);

    expect(screen.queryByText('Professional Summary')).toBeNull();
    expect(screen.getByText('Experience Bullets')).toBeTruthy();
  });

  it('renders the section heading for AI-rewritten content', () => {
    render(<RewritePanel rewrites={{ summary: 'Some summary.' }} />);
    expect(screen.getByRole('region', { name: /ai-rewritten content/i })).toBeTruthy();
  });

  it('renders Copy button for each panel', () => {
    render(
      <RewritePanel
        rewrites={{
          summary: 'Summary text.',
          experience: ['Bullet 1.'],
        }}
      />,
    );

    const copyButtons = screen.getAllByText('Copy');
    expect(copyButtons).toHaveLength(2);
  });
});
