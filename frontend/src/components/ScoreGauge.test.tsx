import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';
import { ScoreGauge } from './ScoreGauge';

/**
 * Feature: ai-resume-optimizer
 * Property 17: Score Gauge Renders Any Valid Score
 *
 * For any integer score in [0, 100], the ScoreGauge component SHALL render
 * a numeric display showing that exact score value, and the visual indicator
 * SHALL reflect the correct color band (red < 50, yellow 50–74, green ≥ 75).
 *
 * Validates: Requirement 8.3
 */
describe('ScoreGauge', () => {
  // ── Property 17: Score gauge renders any valid score ──────────────────────

  it('renders the exact score value for any integer in [0, 100]', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
        const { unmount } = render(<ScoreGauge score={score} />);

        // Numeric display must show the exact score
        expect(screen.getByText(score.toString())).toBeTruthy();

        unmount();
      }),
      { numRuns: 100 },
    );
  });

  it('applies red color class for scores below 50', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 49 }), (score) => {
        const { container, unmount } = render(<ScoreGauge score={score} />);
        const gauge = container.firstChild as HTMLElement;
        expect(gauge.className).toContain('score-gauge--red');
        unmount();
      }),
      { numRuns: 50 },
    );
  });

  it('applies yellow color class for scores 50–74', () => {
    fc.assert(
      fc.property(fc.integer({ min: 50, max: 74 }), (score) => {
        const { container, unmount } = render(<ScoreGauge score={score} />);
        const gauge = container.firstChild as HTMLElement;
        expect(gauge.className).toContain('score-gauge--yellow');
        unmount();
      }),
      { numRuns: 50 },
    );
  });

  it('applies green color class for scores 75–100', () => {
    fc.assert(
      fc.property(fc.integer({ min: 75, max: 100 }), (score) => {
        const { container, unmount } = render(<ScoreGauge score={score} />);
        const gauge = container.firstChild as HTMLElement;
        expect(gauge.className).toContain('score-gauge--green');
        unmount();
      }),
      { numRuns: 50 },
    );
  });

  // ── Specific boundary cases ───────────────────────────────────────────────

  it('renders score 0 with red class', () => {
    const { container } = render(<ScoreGauge score={0} />);
    expect(screen.getByText('0')).toBeTruthy();
    expect((container.firstChild as HTMLElement).className).toContain('score-gauge--red');
  });

  it('renders score 50 with yellow class', () => {
    const { container } = render(<ScoreGauge score={50} />);
    expect(screen.getByText('50')).toBeTruthy();
    expect((container.firstChild as HTMLElement).className).toContain('score-gauge--yellow');
  });

  it('renders score 75 with green class', () => {
    const { container } = render(<ScoreGauge score={75} />);
    expect(screen.getByText('75')).toBeTruthy();
    expect((container.firstChild as HTMLElement).className).toContain('score-gauge--green');
  });

  it('renders score 100 with green class', () => {
    const { container } = render(<ScoreGauge score={100} />);
    expect(screen.getByText('100')).toBeTruthy();
    expect((container.firstChild as HTMLElement).className).toContain('score-gauge--green');
  });

  it('includes aria-label with score value for accessibility', () => {
    render(<ScoreGauge score={78} />);
    expect(screen.getByRole('img', { name: /ATS Score: 78 out of 100/i })).toBeTruthy();
  });
});
