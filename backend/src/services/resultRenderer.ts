import { ScoreResult, AnalysisResult, RewriteResult, ServiceError, ApiResponse } from '../types';

function buildSections(analysis: AnalysisResult) {
  const ALL_SECTIONS = ['contact', 'summary', 'experience', 'education', 'skills'] as const;
  return ALL_SECTIONS.map((s) => {
    const detected = analysis.detectedSections.includes(s);
    const score = detected ? 80 : 20;
    const status: 'good' | 'warn' | 'bad' = detected ? 'good' : 'bad';
    const note = detected ? 'Detected' : 'Missing — add this section';
    return { name: s.charAt(0).toUpperCase() + s.slice(1), score, status, note };
  });
}

function buildCoverLetter(summary?: string): string {
  return `Dear Hiring Team,

I'm excited to apply for this role. ${summary ? summary : 'With a strong background in my field, I am confident I can contribute meaningfully from day one.'}

I take pride in pairing strong execution with measurable impact, and I'm drawn to the opportunity to grow alongside talented colleagues.

I'd welcome the chance to discuss how my experience aligns with your needs. Thank you for your consideration.

Sincerely,
{Your Name}`;
}

function buildReadability(analysis: AnalysisResult) {
  const bulletCount = analysis.weakBullets.length;
  const clarityCount = analysis.clarityIssues.length;
  const words = Math.max(200, bulletCount * 15 + clarityCount * 25 + analysis.detectedSections.length * 80);
  const readingTime = words < 400 ? `${Math.max(15, Math.round((words / 400) * 60))} sec` : `${Math.round(words / 400)} min`;
  return {
    words,
    bullets: bulletCount,
    quantified: Math.max(0, Math.round(analysis.keywordDensityScore * 5)),
    readingTime,
  };
}

/**
 * Assembles the final API_Response from all upstream service outputs.
 *
 * Rules (Requirements 7.1–7.5, 9.1, Design Property 15–16):
 * - Returns all five fields always: score, issues, suggestions, rewrites, errors
 * - Uses safe defaults for any null/failed service: score=0, arrays=[], rewrites={}
 * - Populates errors[] from serviceErrors + any aiError from RewriteResult
 * - NEVER includes raw resume text, file paths, stack traces, or internal fields
 * - All processing is in-memory; nothing written to disk (Req 10.5)
 *
 * @param score      - ScoreResult from Scoring_Engine, or null if it failed
 * @param analysis   - AnalysisResult from Analysis_Service, or null if it failed
 * @param rewrites   - RewriteResult from AI_Rewrite_Service, or null if it failed
 * @param serviceErrors - Array of ServiceError objects from any failed services
 * @returns ApiResponse — always contains all five fields, safe for JSON serialization
 */
export function renderResult(
  score: ScoreResult | null,
  analysis: AnalysisResult | null,
  rewrites: RewriteResult | null,
  serviceErrors: ServiceError[],
): ApiResponse {
  // ── Collect all user-facing error messages ────────────────────────────────
  const errors: string[] = [];

  // Add errors from explicitly failed services
  for (const serviceError of serviceErrors) {
    // Only include the user-facing message — never service names, stack traces,
    // or internal details (Req 7.5, Property 16)
    errors.push(serviceError.message);
  }

  // Add AI rewrite error if present (graceful degradation from AI_Rewrite_Service)
  if (rewrites?.aiError) {
    errors.push(rewrites.aiError);
  }

  // ── Assemble response with safe defaults for failed services ──────────────
  const responseScore = score?.score ?? 0;
  const responseIssues = analysis?.issues ?? [];
  const responseSuggestions = analysis?.suggestions ?? [];
  const responseRewrites = rewrites?.rewrites ?? {};
  // Build cover letter from rewrites if not already present
  const coverLetter = responseRewrites.coverLetter ?? buildCoverLetter(responseRewrites.summary);

  // ── Build the final ApiResponse ───────────────────────────────────────────
  const apiResponse: ApiResponse = {
    score: responseScore,
    issues: responseIssues,
    suggestions: responseSuggestions,
    rewrites: {
      summary: responseRewrites.summary,
      experience: responseRewrites.experience,
      coverLetter,
    },
    errors,
    criteria: {
      detectedSections: analysis?.detectedSections ?? [],
      missingSections: analysis?.missingSections ?? [],
      weakBullets: analysis?.weakBullets ?? [],
      keywordDensityScore: analysis?.keywordDensityScore ?? 0,
      clarityIssues: analysis?.clarityIssues ?? [],
      breakdown: score?.breakdown ?? {
        structure: 0,
        keywords: 0,
        bullets: 0,
        educationContact: 0,
        clarity: 0,
      },
    },
    keywords: {
      matched: analysis?.matchedKeywords ?? [],
      missing: analysis?.missingKeywords ?? [],
    },
    sections: analysis ? buildSections(analysis) : [],
    readability: analysis ? buildReadability(analysis) : { words: 0, bullets: 0, quantified: 0, readingTime: '0 sec' },
  };

  return apiResponse;
}
