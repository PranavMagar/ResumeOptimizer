import { describe, it, expect } from 'vitest';
import { renderResult } from '../../src/services/resultRenderer';
import { ScoreResult, AnalysisResult, RewriteResult, ServiceError } from '../../src/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeScore(overrides: Partial<ScoreResult> = {}): ScoreResult {
  return {
    score: 78,
    breakdown: {
      structure: 25,
      keywords: 18,
      bullets: 20,
      educationContact: 15,
      clarity: 0,
    },
    ...overrides,
  };
}

function makeAnalysis(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    detectedSections: ['contact', 'summary', 'experience', 'education', 'skills'],
    missingSections: [],
    weakBullets: [],
    keywordDensityScore: 0.9,
    clarityIssues: [],
    issues: ['Resume has low keyword density for ATS systems'],
    suggestions: ['Add relevant technical and professional keywords'],
    ...overrides,
  };
}

function makeRewrites(overrides: Partial<RewriteResult> = {}): RewriteResult {
  return {
    rewrites: {
      summary: 'Results-driven engineer with 5 years of experience.',
      experience: ['Led migration reducing deployment time by 40%.'],
    },
    ...overrides,
  };
}

function makeServiceError(
  service: ServiceError['service'],
  message: string,
): ServiceError {
  return { service, message };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('renderResult', () => {
  // 1. All services succeed → full ApiResponse with errors: []
  it('returns full ApiResponse with errors:[] when all services succeed', () => {
    const result = renderResult(makeScore(), makeAnalysis(), makeRewrites(), []);

    expect(result.score).toBe(78);
    expect(result.issues).toEqual(['Resume has low keyword density for ATS systems']);
    expect(result.suggestions).toEqual(['Add relevant technical and professional keywords']);
    expect(result.rewrites.summary).toBe('Results-driven engineer with 5 years of experience.');
    expect(result.rewrites.experience).toHaveLength(1);
    expect(result.errors).toEqual([]);
  });

  // 2. Only rewrite fails → score/issues/suggestions present, errors contains rewrite message
  it('returns partial result when only AI rewrite fails', () => {
    const failedRewrites: RewriteResult = {
      rewrites: {},
      aiError: 'AI rewrite is temporarily unavailable. Your score and suggestions are still accurate.',
    };

    const result = renderResult(makeScore(), makeAnalysis(), failedRewrites, []);

    expect(result.score).toBe(78);
    expect(result.issues).toHaveLength(1);
    expect(result.suggestions).toHaveLength(1);
    expect(result.rewrites).toEqual({});
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('AI rewrite');
  });

  // 3. Scoring fails → score defaults to 0, errors contains scoring failure message
  it('uses score=0 as safe default when scoring service fails', () => {
    const scoringError = makeServiceError('scoring', 'Score calculation failed. Please try again.');

    const result = renderResult(null, makeAnalysis(), makeRewrites(), [scoringError]);

    expect(result.score).toBe(0);
    expect(result.issues).toHaveLength(1); // analysis still succeeded
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toBe('Score calculation failed. Please try again.');
  });

  // 4. Analysis fails → issues/suggestions default to [], errors populated
  it('uses empty arrays as safe defaults when analysis service fails', () => {
    const analysisError = makeServiceError('analysis', 'Resume analysis failed. Please try again.');

    const result = renderResult(makeScore(), null, makeRewrites(), [analysisError]);

    expect(result.score).toBe(78); // score still succeeded
    expect(result.issues).toEqual([]);
    expect(result.suggestions).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toBe('Resume analysis failed. Please try again.');
  });

  // 5. All services fail → safe defaults with populated errors
  it('returns all safe defaults when all services fail', () => {
    const errors = [
      makeServiceError('parser', 'File could not be parsed.'),
      makeServiceError('analysis', 'Analysis failed.'),
      makeServiceError('scoring', 'Scoring failed.'),
      makeServiceError('rewrite', 'Rewrite failed.'),
    ];

    const result = renderResult(null, null, null, errors);

    expect(result.score).toBe(0);
    expect(result.issues).toEqual([]);
    expect(result.suggestions).toEqual([]);
    expect(result.rewrites).toEqual({});
    expect(result.errors).toHaveLength(4);
  });

  // 6. Both serviceErrors AND aiError → all appear in errors[]
  it('includes both serviceErrors and aiError in errors array', () => {
    const scoringError = makeServiceError('scoring', 'Scoring service unavailable.');
    const failedRewrites: RewriteResult = {
      rewrites: {},
      aiError: 'AI rewrite timed out. Your score and suggestions are still accurate.',
    };

    const result = renderResult(null, makeAnalysis(), failedRewrites, [scoringError]);

    expect(result.errors).toHaveLength(2);
    expect(result.errors).toContain('Scoring service unavailable.');
    expect(result.errors).toContain('AI rewrite timed out. Your score and suggestions are still accurate.');
  });

  // 7. All five fields always present (Property 15)
  it('always returns all five required fields', () => {
    const combinations = [
      renderResult(makeScore(), makeAnalysis(), makeRewrites(), []),
      renderResult(null, null, null, []),
      renderResult(makeScore(), null, null, [makeServiceError('analysis', 'failed')]),
      renderResult(null, makeAnalysis(), null, [makeServiceError('scoring', 'failed')]),
    ];

    for (const result of combinations) {
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('rewrites');
      expect(result).toHaveProperty('errors');
      expect(typeof result.score).toBe('number');
      expect(Array.isArray(result.issues)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(typeof result.rewrites).toBe('object');
      expect(Array.isArray(result.errors)).toBe(true);
    }
  });

  // 8. No internal fields leaked (Property 16 — no stack traces, file paths, service names)
  it('does not include internal fields like stack traces or service names in response', () => {
    const result = renderResult(
      makeScore(),
      makeAnalysis(),
      makeRewrites(),
      [makeServiceError('scoring', 'Score calculation failed.')],
    );

    const serialized = JSON.stringify(result);

    // No stack trace markers
    expect(serialized).not.toContain('at ');
    expect(serialized).not.toContain('Error:');
    // No internal service identifiers beyond user-facing messages
    expect(serialized).not.toContain('breakdown');
    expect(serialized).not.toContain('detectedSections');
    expect(serialized).not.toContain('weakBullets');
    expect(serialized).not.toContain('keywordDensityScore');
    expect(serialized).not.toContain('clarityIssues');
  });

  // 9. Rewrites from successful RewriteResult are preserved
  it('preserves rewrites from successful RewriteResult', () => {
    const result = renderResult(
      makeScore(),
      makeAnalysis(),
      makeRewrites({
        rewrites: {
          summary: 'Custom summary text.',
          experience: ['Led team.', 'Built API.'],
        },
      }),
      [],
    );

    expect(result.rewrites.summary).toBe('Custom summary text.');
    expect(result.rewrites.experience).toEqual(['Led team.', 'Built API.']);
  });

  // 10. Empty rewrites when RewriteResult is null
  it('returns empty rewrites object when RewriteResult is null', () => {
    const result = renderResult(makeScore(), makeAnalysis(), null, []);
    expect(result.rewrites).toEqual({});
  });

  // 11. Score from successful ScoreResult is preserved
  it('preserves the exact score from ScoreResult', () => {
    const result = renderResult(makeScore({ score: 42 }), makeAnalysis(), null, []);
    expect(result.score).toBe(42);
  });

  // 12. errors[] is empty when no failures and no aiError
  it('returns empty errors array when everything succeeds', () => {
    const result = renderResult(
      makeScore(),
      makeAnalysis(),
      makeRewrites({ rewrites: { summary: 'text' } }),
      [],
    );
    expect(result.errors).toEqual([]);
  });
});
