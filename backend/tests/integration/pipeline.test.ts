import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

/**
 * Integration tests for the full POST /api/analyze pipeline.
 *
 * External dependencies (pdf-parse, mammoth, OpenAI) are mocked so tests
 * run without real files or API keys.
 *
 * Requirements: 7.1, 7.2, 7.3, 9.1, 9.4
 */

// ── Use vi.hoisted() so mock functions are available before vi.mock hoisting ──

const { mockPdfParseFn, mockMammothFn, mockOpenAICreateFn } = vi.hoisted(() => ({
  mockPdfParseFn: vi.fn(),
  mockMammothFn: vi.fn(),
  mockOpenAICreateFn: vi.fn(),
}));

vi.mock('pdf-parse', () => ({ default: mockPdfParseFn }));
vi.mock('mammoth', () => ({ default: { extractRawText: mockMammothFn } }));
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: mockOpenAICreateFn } },
  })),
}));

// Import app AFTER mocks are set up
import app from '../../src/app';

// ── Realistic resume text ─────────────────────────────────────────────────────

const RESUME_TEXT = `
john.doe@example.com | (555) 123-4567 | linkedin.com/in/johndoe

Summary
Results-driven software engineer with 5 years of experience building scalable web applications.

Experience
Software Engineer — Acme Corp (2019–2024)
- Led migration of legacy monolith to microservices, reducing deployment time by 40%
- Built REST APIs serving 10,000+ daily active users using Node.js and TypeScript

Education
B.S. Computer Science — State University (2019)

Skills
JavaScript, TypeScript, React, Node.js, SQL, Docker, AWS, Git
`.trim();

const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/analyze — integration tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.OPENAI_API_KEY;
  });

  // ── Test 1: Valid PDF → HTTP 200 with full response shape ─────────────────

  it('Test 1: POST a valid PDF → HTTP 200 with score, issues, suggestions, rewrites, errors', async () => {
    mockPdfParseFn.mockResolvedValue({
      text: RESUME_TEXT, numpages: 1, numrender: 1, info: {}, metadata: null, version: '1.10.100',
    });
    process.env.OPENAI_API_KEY = 'test-key';
    mockOpenAICreateFn.mockResolvedValue({
      choices: [{ message: { content: 'AI-generated content.' } }],
    });

    const response = await request(app)
      .post('/api/analyze')
      .attach('resume', Buffer.from('%PDF-1.4 fake'), { filename: 'resume.pdf', contentType: PDF_MIME });

    expect(response.status).toBe(200);
    expect(typeof response.body.score).toBe('number');
    expect(response.body.score).toBeGreaterThanOrEqual(0);
    expect(response.body.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(response.body.issues)).toBe(true);
    expect(Array.isArray(response.body.suggestions)).toBe(true);
    expect(typeof response.body.rewrites).toBe('object');
    expect(Array.isArray(response.body.errors)).toBe(true);
  });

  // ── Test 2: Valid DOCX → HTTP 200 with same shape ─────────────────────────

  it('Test 2: POST a valid DOCX → HTTP 200 with correct response shape', async () => {
    mockMammothFn.mockResolvedValue({ value: RESUME_TEXT, messages: [] });
    process.env.OPENAI_API_KEY = 'test-key';
    mockOpenAICreateFn.mockResolvedValue({
      choices: [{ message: { content: 'AI-generated content.' } }],
    });

    const response = await request(app)
      .post('/api/analyze')
      .attach('resume', Buffer.from('PK fake docx'), { filename: 'resume.docx', contentType: DOCX_MIME });

    expect(response.status).toBe(200);
    expect(typeof response.body.score).toBe('number');
    expect(Array.isArray(response.body.issues)).toBe(true);
    expect(Array.isArray(response.body.suggestions)).toBe(true);
    expect(typeof response.body.rewrites).toBe('object');
    expect(Array.isArray(response.body.errors)).toBe(true);
  });

  // ── Test 3: OpenAI fails → HTTP 200, errors non-empty, score+issues present ─

  it('Test 3: OpenAI throws → HTTP 200, errors non-empty, score and issues still present', async () => {
    // Use resume text WITHOUT a summary section so AI rewrite is triggered
    const resumeWithoutSummary = `
john.doe@example.com | (555) 123-4567 | linkedin.com/in/johndoe

Experience
Software Engineer — Acme Corp (2019–2024)
- Led migration of legacy monolith to microservices, reducing deployment time by 40%
- Built REST APIs serving 10,000+ daily active users using Node.js and TypeScript

Education
B.S. Computer Science — State University (2019)

Skills
JavaScript, TypeScript, React, Node.js, SQL, Docker, AWS, Git
`.trim();

    mockPdfParseFn.mockResolvedValue({
      text: resumeWithoutSummary, numpages: 1, numrender: 1, info: {}, metadata: null, version: '1.10.100',
    });
    process.env.OPENAI_API_KEY = 'test-key';
    // OpenAI throws — should degrade gracefully, errors[] should be non-empty
    mockOpenAICreateFn.mockRejectedValue(new Error('OpenAI rate limit exceeded'));

    const response = await request(app)
      .post('/api/analyze')
      .attach('resume', Buffer.from('%PDF-1.4 fake'), { filename: 'resume.pdf', contentType: PDF_MIME });

    expect(response.status).toBe(200);
    expect(typeof response.body.score).toBe('number');
    expect(Array.isArray(response.body.issues)).toBe(true);
    expect(Array.isArray(response.body.errors)).toBe(true);
    // errors array must be non-empty (AI rewrite failed)
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  // ── Test 4: Password-protected PDF → HTTP 422 ─────────────────────────────

  it('Test 4: Password-protected PDF → HTTP 422 with error field', async () => {
    mockPdfParseFn.mockRejectedValue(new Error('PDF is password protected'));

    const response = await request(app)
      .post('/api/analyze')
      .attach('resume', Buffer.from('%PDF-1.4 encrypted'), { filename: 'resume.pdf', contentType: PDF_MIME });

    expect(response.status).toBe(422);
    expect(typeof response.body.error).toBe('string');
    expect(response.body.error).toContain('password-protected');
  });

  // ── Test 5: .txt file → HTTP 400 ─────────────────────────────────────────

  it('Test 5: POST a .txt file → HTTP 400 with error field', async () => {
    const response = await request(app)
      .post('/api/analyze')
      .attach('resume', Buffer.from('plain text'), { filename: 'resume.txt', contentType: 'text/plain' });

    expect(response.status).toBe(400);
    expect(typeof response.body.error).toBe('string');
    expect(response.body.error).toContain('Only PDF and DOCX');
  });

  // ── Additional: GET /health ───────────────────────────────────────────────

  it('GET /health → HTTP 200 with { status: "ok" }', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  // ── Additional: No file uploaded → HTTP 400 ──────────────────────────────

  it('POST /api/analyze with no file → HTTP 400', async () => {
    const response = await request(app)
      .post('/api/analyze')
      .field('dummy', 'value'); // multipart but no file

    expect(response.status).toBe(400);
  });

  // ── Additional: Response never contains stack traces ─────────────────────

  it('Error responses do not contain stack traces or internal details', async () => {
    mockPdfParseFn.mockRejectedValue(new Error('PDF is password protected'));

    const response = await request(app)
      .post('/api/analyze')
      .attach('resume', Buffer.from('%PDF-1.4 encrypted'), { filename: 'resume.pdf', contentType: PDF_MIME });

    const body = JSON.stringify(response.body);
    expect(body).not.toContain('node_modules');
    expect(body).not.toContain('"stack"');
  });
});
