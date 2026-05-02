import express from 'express';
import { timeoutMiddleware } from './middleware/timeout';
import { errorHandler } from './middleware/errorHandler';
import analyzeRouter from './routes/analyze';

const app = express();

// ── Global middleware ─────────────────────────────────────────────────────────

// 30-second hard timeout on all requests (Requirement 9.3)
app.use(timeoutMiddleware);

// JSON body parser for non-multipart requests
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────

// Health check endpoint (Design: GET /health)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Main analysis endpoint
app.use('/api/analyze', analyzeRouter);

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

export default app;
