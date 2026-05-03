import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalysisResult, RewriteResult } from '../types';

const GEMINI_TIMEOUT_MS = 15_000;
const USER_FACING_UNAVAILABLE =
  'AI rewrite is temporarily unavailable. Your score and suggestions are still accurate.';
const USER_FACING_TIMEOUT =
  'AI rewrite timed out. Your score and suggestions are still accurate.';

/**
 * Calls the Gemini API with a timeout.
 * Uses gemini-1.5-flash — fast, free-tier friendly.
 */
async function callGemini(model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>, prompt: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Generates AI-rewritten content using Google Gemini.
 *
 * Only rewrites sections flagged as missing or weak.
 * Reads GEMINI_API_KEY from environment — never hardcoded.
 * On any failure, returns graceful degradation with aiError set.
 */
export async function generateRewrites(analysis: AnalysisResult): Promise<RewriteResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return { rewrites: {}, aiError: USER_FACING_UNAVAILABLE };
  }

  const needsSummary = analysis.missingSections.includes('summary');
  const needsBullets = analysis.weakBullets.length > 0;

  if (!needsSummary && !needsBullets) {
    return { rewrites: {} };
  }

  let genAI: GoogleGenerativeAI;
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch {
    return { rewrites: {}, aiError: USER_FACING_UNAVAILABLE };
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const rewrites: RewriteResult['rewrites'] = {};

  try {
    if (needsSummary) {
      const prompt =
        'Write a 2-3 sentence professional summary for a resume. ' +
        'Be concise, ATS-friendly, and focus on professional skills and experience. ' +
        'Return only the summary text, no labels or extra formatting.';
      rewrites.summary = await callGemini(model, prompt);
    }

    if (needsBullets) {
      const rewrittenBullets: string[] = [];
      for (const bullet of analysis.weakBullets) {
        const prompt =
          `Rewrite this resume bullet point to use a strong action verb and include a measurable outcome. ` +
          `Return only the rewritten bullet, no labels or extra formatting.\n\nOriginal: ${bullet}`;
        const rewritten = await callGemini(model, prompt);
        rewrittenBullets.push(rewritten);
      }
      rewrites.experience = rewrittenBullets;
    }

    return { rewrites };
  } catch (err) {
    if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('abort'))) {
      return { rewrites: {}, aiError: USER_FACING_TIMEOUT };
    }
    return { rewrites: {}, aiError: USER_FACING_UNAVAILABLE };
  }
}
