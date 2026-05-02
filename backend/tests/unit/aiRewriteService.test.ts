import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalysisResult } from '../../src/types';

// ── Mock openai ───────────────────────────────────────────────────────────────
// We define the mock create function at module scope so all tests share it.
const mockCreate = vi.fn();

vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

import { generateRewrites } from '../../src/services/aiRewriteService';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAnalysis(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    detectedSections: ['contact', 'experience', 'education', 'skills'],
    missingSections: ['summary'],
    weakBullets: [],
    keywordDensityScore: 0.8,
    clarityIssues: [],
    issues: [],
    suggestions: [],
    ...overrides,
  };
}

function mockOpenAIResponse(text: string) {
  mockCreate.mockResolvedValue({
    choices: [{ message: { content: text } }],
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('generateRewrites', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    delete process.env.OPENAI_API_KEY;
  });

  // 1. Missing OPENAI_API_KEY → graceful degradation, OpenAI not called
  it('returns aiError when OPENAI_API_KEY is not set', async () => {
    const result = await generateRewrites(makeAnalysis());

    expect(result.aiError).toBeDefined();
    expect(result.rewrites).toEqual({});
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns aiError when OPENAI_API_KEY is empty string', async () => {
    process.env.OPENAI_API_KEY = '';
    const result = await generateRewrites(makeAnalysis());

    expect(result.aiError).toBeDefined();
    expect(result.rewrites).toEqual({});
  });

  // 2. Summary missing → OpenAI called with summary prompt, result in rewrites.summary
  it('calls OpenAI for summary when summary is in missingSections', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockOpenAIResponse('Results-driven engineer with 5 years of experience.');

    const result = await generateRewrites(
      makeAnalysis({ missingSections: ['summary'], weakBullets: [] }),
    );

    expect(mockCreate).toHaveBeenCalledOnce();
    expect(result.rewrites.summary).toBe(
      'Results-driven engineer with 5 years of experience.',
    );
    expect(result.aiError).toBeUndefined();
  });

  // 3. Weak bullets present → OpenAI called once per bullet, results in rewrites.experience
  it('calls OpenAI once per weak bullet and returns experience array', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockCreate
      .mockResolvedValueOnce({ choices: [{ message: { content: 'Led team of 5 engineers.' } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: 'Built REST API serving 10k users.' } }] });

    const result = await generateRewrites(
      makeAnalysis({
        missingSections: [],
        detectedSections: ['contact', 'summary', 'experience', 'education', 'skills'],
        weakBullets: ['- helped with backend', '- assisted with deployment'],
      }),
    );

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result.rewrites.experience).toHaveLength(2);
    expect(result.rewrites.experience![0]).toBe('Led team of 5 engineers.');
    expect(result.rewrites.experience![1]).toBe('Built REST API serving 10k users.');
    expect(result.aiError).toBeUndefined();
  });

  // 4. No summary missing AND no weak bullets → OpenAI NOT called
  it('does not call OpenAI when nothing needs rewriting', async () => {
    process.env.OPENAI_API_KEY = 'test-key';

    const result = await generateRewrites(
      makeAnalysis({
        missingSections: ['contact'], // contact missing, not summary
        weakBullets: [],
      }),
    );

    expect(mockCreate).not.toHaveBeenCalled();
    expect(result.rewrites).toEqual({});
    expect(result.aiError).toBeUndefined();
  });

  // 5. Section NOT in missingSections → NOT included in rewrites (Property 13)
  it('does not rewrite sections that are not flagged as missing or weak', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockOpenAIResponse('Rewritten summary text.');

    const result = await generateRewrites(
      makeAnalysis({
        missingSections: ['summary'],
        detectedSections: ['contact', 'experience', 'education', 'skills'],
        weakBullets: [],
      }),
    );

    expect(result.rewrites.summary).toBeDefined();
    expect((result.rewrites as Record<string, unknown>).education).toBeUndefined();
    expect((result.rewrites as Record<string, unknown>).skills).toBeUndefined();
    expect((result.rewrites as Record<string, unknown>).contact).toBeUndefined();
  });

  // 6. OpenAI throws error → graceful degradation (Property 14)
  it('returns aiError gracefully when OpenAI throws an error', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockCreate.mockRejectedValue(new Error('OpenAI API error: rate limit exceeded'));

    const result = await generateRewrites(makeAnalysis());

    expect(result.rewrites).toEqual({});
    expect(result.aiError).toBeDefined();
    expect(result.aiError).toContain('unavailable');
  });

  // 7. AbortError → graceful degradation with timeout message
  it('returns aiError gracefully when OpenAI call is aborted (timeout)', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockCreate.mockRejectedValue(abortError);

    const result = await generateRewrites(makeAnalysis());

    expect(result.rewrites).toEqual({});
    expect(result.aiError).toBeDefined();
    // AbortError should return the timeout message
    expect(result.aiError).toContain('timed out');
  });

  // 8. Both summary and bullets need rewriting → both present in rewrites
  it('rewrites both summary and experience bullets when both are needed', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockCreate
      .mockResolvedValueOnce({ choices: [{ message: { content: 'Professional summary text.' } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: 'Led project delivery on time.' } }] });

    const result = await generateRewrites(
      makeAnalysis({
        missingSections: ['summary'],
        weakBullets: ['- helped with project'],
      }),
    );

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result.rewrites.summary).toBe('Professional summary text.');
    expect(result.rewrites.experience).toHaveLength(1);
    expect(result.rewrites.experience![0]).toBe('Led project delivery on time.');
    expect(result.aiError).toBeUndefined();
  });

  // 9. Bullet prompt includes the bullet text (Req 6.7 — minimal context)
  it('includes the bullet text in the bullet rewrite prompt', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockOpenAIResponse('Delivered project on schedule.');

    await generateRewrites(
      makeAnalysis({
        missingSections: [],
        detectedSections: ['contact', 'summary', 'experience', 'education', 'skills'],
        weakBullets: ['- helped with the backend API'],
      }),
    );

    const callArgs = mockCreate.mock.calls[0][0];
    const prompt = callArgs.messages[0].content as string;
    expect(prompt).toContain('- helped with the backend API');
  });
});
