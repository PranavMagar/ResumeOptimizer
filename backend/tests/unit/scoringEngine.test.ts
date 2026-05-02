import { describe, it, expect } from 'vitest';
import { computeScore } from '../../src/services/scoringEngine';
import { AppError } from '../../src/services/uploadService';
import { AnalysisResult, SectionName } from '../../src/types';

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Builds a valid AnalysisResult with sensible defaults.
 * Pass overrides to change specific fields.
 */
function makeAnalysis(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    detectedSections: ['contact', 'summary', 'experience', 'education', 'skills'],
    missingSections: [],
    weakBullets: [],
    keywordDensityScore: 1.0,
    clarityIssues: [],
    issues: [],
    suggestions: [],
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('computeScore', () => {
  // 1. Perfect resume
  it('perfect resume scores 100 with breakdown summing to 100', () => {
    const result = computeScore(makeAnalysis());
    expect(result.score).toBe(100);
    const { structure, keywords, bullets, educationContact, clarity } = result.breakdown;
    expect(structure + keywords + bullets + educationContact + clarity).toBe(100);
  });

  // 2. Worst case
  it('worst case scores 0 or very low', () => {
    const result = computeScore(
      makeAnalysis({
        detectedSections: [],
        missingSections: ['contact', 'summary', 'experience', 'education', 'skills'],
        weakBullets: ['helped with stuff', 'assisted team', 'worked on project', 'responsible for tasks', 'supported manager'],
        keywordDensityScore: 0,
        clarityIssues: ['sentence one', 'sentence two', 'sentence three', 'sentence four', 'sentence five'],
      }),
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
  });

  // 3. Structure only — all 5 sections, everything else worst
  it('structure component equals 25 when all 5 sections are detected', () => {
    const result = computeScore(
      makeAnalysis({
        detectedSections: ['contact', 'summary', 'experience', 'education', 'skills'],
        weakBullets: ['helped', 'assisted', 'worked on', 'responsible for', 'supported'],
        keywordDensityScore: 0,
        clarityIssues: ['a', 'b', 'c', 'd', 'e'],
      }),
    );
    expect(result.breakdown.structure).toBe(25);
  });

  // 4. Keywords only — keywordDensityScore=1.0, no sections, no bullets, clarity issues
  it('keywords component equals 20 when keywordDensityScore is 1.0', () => {
    const result = computeScore(
      makeAnalysis({
        detectedSections: [],
        missingSections: ['contact', 'summary', 'experience', 'education', 'skills'],
        weakBullets: ['helped', 'assisted', 'worked on', 'responsible for', 'supported'],
        keywordDensityScore: 1.0,
        clarityIssues: ['a', 'b', 'c', 'd', 'e'],
      }),
    );
    expect(result.breakdown.keywords).toBe(20);
  });

  // 5. Education + contact present → educationContact = 15
  it('educationContact equals 15 when both education and contact are detected', () => {
    const result = computeScore(
      makeAnalysis({
        detectedSections: ['education', 'contact'],
        missingSections: ['summary', 'experience', 'skills'],
      }),
    );
    expect(result.breakdown.educationContact).toBe(15);
  });

  // 6. Only education present → educationContact = 8 (Math.round(7.5))
  it('educationContact equals 8 when only education is detected', () => {
    const result = computeScore(
      makeAnalysis({
        detectedSections: ['education'],
        missingSections: ['contact', 'summary', 'experience', 'skills'],
      }),
    );
    expect(result.breakdown.educationContact).toBe(8);
  });

  // 7. 0 clarity issues → clarity = 15
  it('clarity equals 15 when there are no clarity issues', () => {
    const result = computeScore(makeAnalysis({ clarityIssues: [] }));
    expect(result.breakdown.clarity).toBe(15);
  });

  // 8. 5 clarity issues → clarity = 0 (15 - 5*3 = 0)
  it('clarity equals 0 when there are 5 or more clarity issues', () => {
    const result = computeScore(
      makeAnalysis({
        clarityIssues: ['s1', 's2', 's3', 's4', 's5'],
      }),
    );
    expect(result.breakdown.clarity).toBe(0);
  });

  // 9. Malformed input (null) → throws AppError with statusCode 500
  it('throws AppError with statusCode 500 for null input', () => {
    expect(() => computeScore(null as unknown as AnalysisResult)).toThrow(AppError);
    try {
      computeScore(null as unknown as AnalysisResult);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(500);
    }
  });

  it('throws AppError with statusCode 500 for undefined input', () => {
    expect(() => computeScore(undefined as unknown as AnalysisResult)).toThrow(AppError);
  });

  it('throws AppError with statusCode 500 when required fields are missing', () => {
    expect(() =>
      computeScore({ detectedSections: [] } as unknown as AnalysisResult),
    ).toThrow(AppError);
  });

  // 10. score is always an integer in [0, 100]
  it('score is always an integer in [0, 100] for various inputs', () => {
    const inputs: Partial<AnalysisResult>[] = [
      {},
      { detectedSections: [], missingSections: ['contact', 'summary', 'experience', 'education', 'skills'], keywordDensityScore: 0, weakBullets: [], clarityIssues: [] },
      { detectedSections: ['contact'], keywordDensityScore: 0.5, weakBullets: ['helped'], clarityIssues: ['long sentence here'] },
      { detectedSections: ['contact', 'summary'], keywordDensityScore: 0.75, weakBullets: [], clarityIssues: ['a', 'b'] },
      { keywordDensityScore: 0.3, weakBullets: ['assisted', 'worked on'], clarityIssues: ['x'] },
    ];

    for (const override of inputs) {
      const result = computeScore(makeAnalysis(override));
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(result.score)).toBe(true);
    }
  });

  // 11. breakdown components sum to score
  it('breakdown components always sum exactly to score', () => {
    const inputs: Partial<AnalysisResult>[] = [
      {},
      { detectedSections: [], missingSections: ['contact', 'summary', 'experience', 'education', 'skills'], keywordDensityScore: 0, weakBullets: [], clarityIssues: [] },
      { detectedSections: ['contact', 'education'], keywordDensityScore: 0.5, weakBullets: ['helped'], clarityIssues: ['long sentence'] },
      { detectedSections: ['contact', 'summary', 'experience'], keywordDensityScore: 0.8, weakBullets: ['assisted', 'worked on'], clarityIssues: ['a', 'b', 'c'] },
      { keywordDensityScore: 1.0, weakBullets: [], clarityIssues: [] },
      { detectedSections: ['contact', 'summary', 'experience', 'education', 'skills'], keywordDensityScore: 0.6, weakBullets: ['helped'], clarityIssues: ['x'] },
    ];

    for (const override of inputs) {
      const result = computeScore(makeAnalysis(override));
      const { structure, keywords, bullets, educationContact, clarity } = result.breakdown;
      expect(structure + keywords + bullets + educationContact + clarity).toBe(result.score);
    }
  });

  // Additional: each breakdown component stays within its max
  it('each breakdown component stays within its maximum', () => {
    const result = computeScore(makeAnalysis());
    expect(result.breakdown.structure).toBeLessThanOrEqual(25);
    expect(result.breakdown.keywords).toBeLessThanOrEqual(20);
    expect(result.breakdown.bullets).toBeLessThanOrEqual(25);
    expect(result.breakdown.educationContact).toBeLessThanOrEqual(15);
    expect(result.breakdown.clarity).toBeLessThanOrEqual(15);
  });

  // Additional: 0 weak bullets → bullets = 25
  it('bullets equals 25 when there are no weak bullets', () => {
    const result = computeScore(makeAnalysis({ weakBullets: [] }));
    expect(result.breakdown.bullets).toBe(25);
  });

  // Additional: structure scales with section count
  it('structure is proportional to detected section count', () => {
    const sections: SectionName[] = ['contact', 'summary', 'experience', 'education', 'skills'];
    for (let i = 0; i <= 5; i++) {
      const result = computeScore(
        makeAnalysis({
          detectedSections: sections.slice(0, i) as SectionName[],
          missingSections: sections.slice(i) as SectionName[],
        }),
      );
      expect(result.breakdown.structure).toBe(i * 5);
    }
  });
});
