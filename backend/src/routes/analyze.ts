import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { validateUpload } from '../services/uploadService';
import { parseFile } from '../services/parserService';
import { analyzeText } from '../services/analysisService';
import { computeScore } from '../services/scoringEngine';
import { generateRewrites } from '../services/aiRewriteService';
import { renderResult } from '../services/resultRenderer';
import { ServiceError, ScoreResult, AnalysisResult, RewriteResult } from '../types';
import { logInfo, logError } from '../utils/logger';

const router = Router();

// Multer configured for memory storage — files never written to disk (Req 10.1)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 }, // 6 MB multer limit (service enforces 5 MB)
});

/**
 * POST /api/analyze
 *
 * Orchestrates the full resume analysis pipeline:
 *   validateUpload → parseFile → analyzeText → [computeScore + generateRewrites] → renderResult
 *
 * Scoring and AI rewrite run in parallel (Promise.allSettled) for performance.
 * Pipeline is fail-partial: scoring/rewrite failures degrade gracefully.
 * Parser failure short-circuits immediately (Requirement 9.4).
 *
 * Each request gets a UUID v4 correlation ID for log tracing (Requirement 9.2).
 */
router.post(
  '/',
  upload.single('resume'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const correlationId = uuidv4();
    // Attach correlation ID to response headers for client-side support tracing
    res.setHeader('x-correlation-id', correlationId);
    req.headers['x-correlation-id'] = correlationId;

    logInfo(correlationId, 'analyze', 'Request received');

    try {
      // ── Step 1: Validate upload ─────────────────────────────────────────
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded. Please attach a resume file.' });
        return;
      }

      const uploadResult = validateUpload(req.file);

      // ── Step 2: Parse file ──────────────────────────────────────────────
      // Parser failure short-circuits — no downstream calls (Req 9.4)
      const parseResult = await parseFile(uploadResult);

      // ── Step 3: Analyze text ────────────────────────────────────────────
      const profession = (req.body.profession as string) || 'other';
      const targetRole = (req.body.targetRole as string) || '';
      const jobDescription = (req.body.jobDescription as string) || '';
      const analysisResult = await analyzeText(parseResult.text, { profession, targetRole, jobDescription });

      // ── Step 4: Score + Rewrite in parallel ─────────────────────────────
      const serviceErrors: ServiceError[] = [];
      let scoreResult: ScoreResult | null = null;
      let rewriteResult: RewriteResult | null = null;

      const [scoreSettled, rewriteSettled] = await Promise.allSettled([
        computeScore(analysisResult),
        generateRewrites(analysisResult),
      ]);

      if (scoreSettled.status === 'fulfilled') {
        scoreResult = scoreSettled.value;
      } else {
        logError(
          correlationId,
          'scoring',
          'ScoringError',
          'Scoring engine failed',
          scoreSettled.reason instanceof Error ? scoreSettled.reason.stack : undefined,
        );
        serviceErrors.push({
          service: 'scoring',
          message: 'Score calculation failed. Your suggestions are still available.',
        });
      }

      if (rewriteSettled.status === 'fulfilled') {
        rewriteResult = rewriteSettled.value;
      } else {
        logError(
          correlationId,
          'rewrite',
          'RewriteError',
          'AI rewrite service failed',
          rewriteSettled.reason instanceof Error ? rewriteSettled.reason.stack : undefined,
        );
        serviceErrors.push({
          service: 'rewrite',
          message: 'AI rewrite is temporarily unavailable. Your score and suggestions are still accurate.',
        });
      }

      // ── Step 5: Render result ───────────────────────────────────────────
      const apiResponse = renderResult(
        scoreResult,
        analysisResult,
        rewriteResult,
        serviceErrors,
        parseResult.text,
        profession,
        targetRole,
      );

      logInfo(correlationId, 'analyze', 'Request completed successfully');
      res.status(200).json(apiResponse);
    } catch (err) {
      // Pass to global error handler (handles AppError → 400/422/500)
      next(err);
    }
  },
);

export default router;
