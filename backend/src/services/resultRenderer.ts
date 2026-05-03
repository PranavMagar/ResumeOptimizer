import { ScoreResult, AnalysisResult, RewriteResult, ServiceError, ApiResponse } from '../types';

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

  // ── Build the final ApiResponse ───────────────────────────────────────────
  const apiResponse: ApiResponse = {
    score: responseScore,
    issues: responseIssues,
    suggestions: responseSuggestions,
    rewrites: responseRewrites,
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
  };

  return apiResponse;
}
