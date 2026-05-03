import { AnalysisResult, ScoreResult } from '../types';
import { AppError } from './uploadService';

/**
 * Validates that the analysis object has all required fields.
 * Throws AppError(500) if any required field is missing or the object is null/undefined.
 */
function validateAnalysis(analysis: unknown): asserts analysis is AnalysisResult {
  if (analysis == null || typeof analysis !== 'object') {
    throw new AppError('Invalid analysis result: missing required fields.', 500);
  }

  const a = analysis as Record<string, unknown>;
  const requiredFields = [
    'detectedSections',
    'missingSections',
    'weakBullets',
    'keywordDensityScore',
    'clarityIssues',
  ];

  for (const field of requiredFields) {
    if (!(field in a) || a[field] === undefined || a[field] === null) {
      throw new AppError('Invalid analysis result: missing required fields.', 500);
    }
  }

  if (!Array.isArray(a['detectedSections'])) {
    throw new AppError('Invalid analysis result: missing required fields.', 500);
  }
  if (!Array.isArray(a['missingSections'])) {
    throw new AppError('Invalid analysis result: missing required fields.', 500);
  }
  if (!Array.isArray(a['weakBullets'])) {
    throw new AppError('Invalid analysis result: missing required fields.', 500);
  }
  if (typeof a['keywordDensityScore'] !== 'number') {
    throw new AppError('Invalid analysis result: missing required fields.', 500);
  }
  if (!Array.isArray(a['clarityIssues'])) {
    throw new AppError('Invalid analysis result: missing required fields.', 500);
  }
}

/**
 * Computes an ATS score from an AnalysisResult.
 *
 * Scoring formula (max 100 total):
 *   - structure (max 25):       5 pts per detected section
 *   - keywords (max 20):        proportional to keywordDensityScore
 *   - bullets (max 25):         25 if no weak bullets; deduct 5 per weak bullet
 *   - educationContact (max 15): 7.5 pts each for 'education' and 'contact'
 *   - clarity (max 15):         15 minus 3 pts per clarity issue
 *
 * The final score is the integer sum of all components, clamped to [0, 100].
 * The breakdown values always sum exactly to the returned score.
 *
 * @param analysis - The AnalysisResult produced by the Analysis_Service
 * @returns ScoreResult with integer score and breakdown
 * @throws AppError(500) if analysis is null/undefined or missing required fields
 */
export function computeScore(analysis: AnalysisResult): ScoreResult {
  validateAnalysis(analysis);

  // ── Structure (max 25) ────────────────────────────────────────────────────
  const structure = Math.min(analysis.detectedSections.length * 5, 25);

  // ── Keywords (max 20) ─────────────────────────────────────────────────────
  // Power curve: partial scores penalized more steeply
  const keywords = Math.round(Math.pow(analysis.keywordDensityScore, 1.5) * 20);

  // ── Bullets (max 25) ──────────────────────────────────────────────────────
  // Deduct 7pts per weak bullet (stricter than before), minimum 0
  const bullets =
    analysis.weakBullets.length === 0
      ? 25
      : Math.max(0, Math.round(25 - analysis.weakBullets.length * 7));

  // ── Education + Contact (max 15) ──────────────────────────────────────────
  const educationPts = analysis.detectedSections.includes('education') ? 7.5 : 0;
  const contactPts = analysis.detectedSections.includes('contact') ? 7.5 : 0;
  const educationContact = Math.round(educationPts + contactPts);
  // Results: 0 (neither), 8 (one of them, Math.round(7.5)=8), or 15 (both)

  // ── Clarity (max 15) ──────────────────────────────────────────────────────
  // Deduct 4pts per long sentence (stricter — was 3)
  const clarity = Math.max(0, 15 - analysis.clarityIssues.length * 4);

  // ── Raw sum and clamped score ─────────────────────────────────────────────
  const rawScore = structure + keywords + bullets + educationContact + clarity;
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  // ── Ensure breakdown sums exactly to score ────────────────────────────────
  // If rawScore was clamped (> 100 or < 0), adjust the breakdown proportionally
  // so that the invariant breakdown.sum === score always holds.
  let finalStructure = structure;
  let finalKeywords = keywords;
  let finalBullets = bullets;
  let finalEducationContact = educationContact;
  let finalClarity = clarity;

  if (rawScore !== score && rawScore > 0) {
    // Scale each component proportionally to match the clamped score
    const scale = score / rawScore;
    finalStructure = Math.round(structure * scale);
    finalKeywords = Math.round(keywords * scale);
    finalBullets = Math.round(bullets * scale);
    finalEducationContact = Math.round(educationContact * scale);
    // Assign remainder to clarity to ensure exact sum
    finalClarity = score - finalStructure - finalKeywords - finalBullets - finalEducationContact;
    // Clamp clarity to [0, 15] — if rounding pushed it out of range, redistribute
    finalClarity = Math.max(0, Math.min(15, finalClarity));
    // Final safety: recompute score from adjusted breakdown
    const adjustedSum =
      finalStructure + finalKeywords + finalBullets + finalEducationContact + finalClarity;
    if (adjustedSum !== score) {
      // Absorb any remaining rounding difference into the largest component
      const diff = score - adjustedSum;
      finalStructure += diff;
    }
  }

  return {
    score,
    breakdown: {
      structure: finalStructure,
      keywords: finalKeywords,
      bullets: finalBullets,
      educationContact: finalEducationContact,
      clarity: finalClarity,
    },
  };
}
