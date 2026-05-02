import { describe, it, expect } from 'vitest';
import { render, within } from '@testing-library/react';
import fc from 'fast-check';
import { ErrorNotice } from './ErrorNotice';

/**
 * Feature: ai-resume-optimizer
 * Property 20: Error Display Contains No Technical Details
 *
 * For any errors array in an ApiResponse, the ErrorNotice component SHALL
 * render a user-facing message for each error that does not contain HTTP
 * status codes, stack traces, file paths, or internal service names.
 *
 * Validates: Requirements 8.6, 9.5
 */
describe('ErrorNotice', () => {
  // ── Property 20: Error display contains no technical details ──────────────

  it('renders user-facing error messages without technical details', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 100 }).filter(
            (s) =>
              s.trim().length > 0 &&
              !/\b[45]\d{2}\b/.test(s) &&
              !s.includes('at ') &&
              !s.includes('Error:'),
          ),
          { minLength: 1, maxLength: 5 },
        ),
        (errors) => {
          const { unmount, container } = render(<ErrorNotice errors={errors} />);
          const scope = within(container);
          const text = container.textContent ?? '';

          // Must NOT contain HTTP status codes (4xx or 5xx)
          expect(/\b[45]\d{2}\b/.test(text)).toBe(false);

          // Must NOT contain stack trace markers
          expect(text.includes('at ')).toBe(false);
          expect(text.includes('Error:')).toBe(false);

          // Each error message must be visible within this render's container
          for (const error of errors) {
            expect(scope.getAllByText(error.trim()).length).toBeGreaterThan(0);
          }

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });

  // ── Specific cases ────────────────────────────────────────────────────────

  it('renders nothing when errors array is empty', () => {
    const { container } = render(<ErrorNotice errors={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a single error message', () => {
    const { getByText } = render(
      <ErrorNotice
        errors={['AI rewrite is temporarily unavailable. Your score and suggestions are still accurate.']}
      />,
    );
    expect(
      getByText(
        'AI rewrite is temporarily unavailable. Your score and suggestions are still accurate.',
      ),
    ).toBeTruthy();
  });

  it('renders multiple error messages', () => {
    const errors = [
      'AI rewrite is temporarily unavailable.',
      'Score calculation failed. Your suggestions are still available.',
    ];
    const { getByText } = render(<ErrorNotice errors={errors} />);
    for (const error of errors) {
      expect(getByText(error)).toBeTruthy();
    }
  });

  it('has role="alert" for accessibility', () => {
    const { getByRole } = render(<ErrorNotice errors={['Some error message.']} />);
    expect(getByRole('alert')).toBeTruthy();
  });

  it('does not render HTTP status codes even if passed in error strings', () => {
    const { container } = render(<ErrorNotice errors={['Service temporarily unavailable']} />);
    expect(/\b[45]\d{2}\b/.test(container.textContent ?? '')).toBe(false);
  });

  it('does not render stack trace markers', () => {
    const { container } = render(<ErrorNotice errors={['Something went wrong']} />);
    expect((container.textContent ?? '').includes('Error:')).toBe(false);
  });
});
