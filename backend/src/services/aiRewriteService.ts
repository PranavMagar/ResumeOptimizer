import OpenAI from 'openai';
import { AnalysisResult, RewriteResult } from '../types';

const OPENAI_TIMEOUT_MS = 10_000; // 10 seconds per call (Req 6.5)
const USER_FACING_UNAVAILABLE =
  'AI rewrite is temporarily unavailable. Your score and suggestions are still accurate.';
const USER_FACING_TIMEOUT =
  'AI rewrite timed out. Your score and suggestions are still accurate.';

/**
 * Calls the OpenAI API with a 10-second AbortController timeout.
 * Returns the response text or throws on failure/timeout.
 */
async function callOpenAI(
  client: OpenAI,
  prompt: string,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const response = await client.chat.completions.create(
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      },
      { signal: controller.signal },
    );
    return response.choices[0]?.message?.content?.trim() ?? '';
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Generates AI-rewritten content for weak or missing resume sections.
 *
 * Only rewrites sections flagged as missing or weak — never touches passing
 * sections (Requirement 6.4, Property 13).
 *
 * Reads OPENAI_API_KEY from environment variable — never hardcoded (Req 6.8).
 * All processing is in-memory; nothing written to disk (Req 10.2, 10.5).
 *
 * On any failure (missing key, API error, timeout), returns a graceful
 * degradation result with aiError set — never rethrows (Req 6.6, Property 14).
 *
 * @param analysis - The AnalysisResult from the Analysis_Service
 * @returns RewriteResult with rewrites object and optional aiError
 */
export async function generateRewrites(
  analysis: AnalysisResult,
): Promise<RewriteResult> {
  // Guard: missing API key — degrade gracefully (Req 6.8)
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return { rewrites: {}, aiError: USER_FACING_UNAVAILABLE };
  }

  // Short-circuit: nothing to rewrite
  const needsSummary = analysis.missingSections.includes('summary');
  const needsBullets = analysis.weakBullets.length > 0;

  if (!needsSummary && !needsBullets) {
    return { rewrites: {} };
  }

  const client = new OpenAI({ apiKey });
  const rewrites: RewriteResult['rewrites'] = {};

  try {
    // ── Summary rewrite (only if summary is missing) ──────────────────────
    if (needsSummary) {
      const summaryPrompt =
        'Write a 2-3 sentence professional summary for a resume. ' +
        'Be concise and ATS-friendly. Focus on professional skills and experience.';
      rewrites.summary = await callOpenAI(client, summaryPrompt);
    }

    // ── Experience bullet rewrites (only for flagged weak bullets) ─────────
    if (needsBullets) {
      const rewrittenBullets: string[] = [];
      for (const bullet of analysis.weakBullets) {
        const bulletPrompt =
          `Rewrite this resume bullet point to use a strong action verb and ` +
          `include a measurable outcome: ${bullet}`;
        const rewritten = await callOpenAI(client, bulletPrompt);
        rewrittenBullets.push(rewritten);
      }
      rewrites.experience = rewrittenBullets;
    }

    return { rewrites };
  } catch (err) {
    // Detect AbortController timeout (DOMException name 'AbortError')
    if (
      err instanceof Error &&
      (err.name === 'AbortError' || err.message.includes('abort'))
    ) {
      return { rewrites: {}, aiError: USER_FACING_TIMEOUT };
    }
    // Any other OpenAI or network error
    return { rewrites: {}, aiError: USER_FACING_UNAVAILABLE };
  }
}
