import { describe, it, expect } from 'vitest';
import { analyzeText } from '../../src/services/analysisService';
import { AppError } from '../../src/services/uploadService';

// ── Realistic resume text snippets ──────────────────────────────────────────

/**
 * A resume text that contains all five sections.
 * Long enough (≥ 50 chars) and includes clear section markers.
 */
const FULL_RESUME = `
John Doe
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

/**
 * A resume text with NO recognizable section headers or contact patterns.
 * Still ≥ 50 chars so it passes the length guard.
 */
const NO_SECTIONS_TEXT =
  'This is a plain paragraph of text that does not contain any resume section headers or contact details at all.';

/**
 * A resume text with only some sections present (contact + experience).
 */
const PARTIAL_RESUME = `
jane.smith@example.com | (555) 987-6543

Experience
- Helped the team with various tasks and supported the project manager
- Worked on the frontend codebase and assisted with bug fixes
`.trim();

// ── Tests ────────────────────────────────────────────────────────────────────

describe('analyzeText', () => {
  // ── 1. All 5 sections present ──────────────────────────────────────────────

  it('detects all 5 sections when all are present', async () => {
    const result = await analyzeText(FULL_RESUME);

    expect(result.missingSections).toHaveLength(0);
    expect(result.detectedSections).toHaveLength(5);
    expect(result.detectedSections).toContain('contact');
    expect(result.detectedSections).toContain('summary');
    expect(result.detectedSections).toContain('experience');
    expect(result.detectedSections).toContain('education');
    expect(result.detectedSections).toContain('skills');
  });

  // ── 2. No sections present ────────────────────────────────────────────────

  it('puts all 5 sections in missingSections when none are present', async () => {
    const result = await analyzeText(NO_SECTIONS_TEXT);

    expect(result.detectedSections).toHaveLength(0);
    expect(result.missingSections).toHaveLength(5);
    expect(result.missingSections).toContain('contact');
    expect(result.missingSections).toContain('summary');
    expect(result.missingSections).toContain('experience');
    expect(result.missingSections).toContain('education');
    expect(result.missingSections).toContain('skills');
  });

  // ── 3. Text shorter than 50 chars throws AppError 422 ─────────────────────

  it('throws AppError with statusCode 422 for text shorter than 50 chars', async () => {
    await expect(analyzeText('Too short')).rejects.toThrow(AppError);
    await expect(analyzeText('Too short')).rejects.toMatchObject({
      statusCode: 422,
      message:
        'Resume content is too short to analyze. Please upload a complete resume.',
    });
  });

  it('throws AppError 422 for empty string', async () => {
    await expect(analyzeText('')).rejects.toMatchObject({ statusCode: 422 });
  });

  it('throws AppError 422 for whitespace-only string under 50 chars', async () => {
    await expect(analyzeText('   ')).rejects.toMatchObject({ statusCode: 422 });
  });

  // ── 4. Bullet with weak verb "helped" appears in weakBullets ──────────────

  it('flags a bullet containing "helped" as a weak bullet', async () => {
    const text = `
jane.smith@example.com

Experience
- Helped the team deliver the quarterly product release on time
- Assisted with onboarding new engineers and supported daily standups
`.trim();

    const result = await analyzeText(text);

    expect(result.weakBullets.length).toBeGreaterThan(0);
    const hasHelped = result.weakBullets.some((b) =>
      b.toLowerCase().includes('helped'),
    );
    expect(hasHelped).toBe(true);
  });

  // ── 5. Bullet with strong verb "Led" is NOT in weakBullets ────────────────

  it('does not flag a bullet with a strong verb like "Led"', async () => {
    const text = `
john.doe@example.com

Experience
- Led the migration of the legacy monolith to a microservices architecture
- Built and deployed REST APIs serving over 10,000 daily active users
`.trim();

    const result = await analyzeText(text);

    const hasStrongBullet = result.weakBullets.some(
      (b) => b.toLowerCase().startsWith('- led') || b.toLowerCase().startsWith('- built'),
    );
    expect(hasStrongBullet).toBe(false);
  });

  // ── 6. Sentence > 30 words appears in clarityIssues ───────────────────────

  it('flags a sentence with more than 30 words in clarityIssues', async () => {
    // Construct a sentence that is clearly > 30 words
    const longSentence =
      'I have extensive experience working with many different technologies and frameworks ' +
      'including JavaScript TypeScript React Node SQL Docker AWS Kubernetes and many other tools ' +
      'that are commonly used in modern software development projects';

    const text = `john.doe@example.com\n\nExperience\n${longSentence}.`;

    const result = await analyzeText(text);

    expect(result.clarityIssues.length).toBeGreaterThan(0);
    const flagged = result.clarityIssues.some((s) =>
      s.includes('extensive experience'),
    );
    expect(flagged).toBe(true);
  });

  // ── 7. Sentence ≤ 30 words is NOT in clarityIssues ────────────────────────

  it('does not flag a short sentence (≤ 30 words) in clarityIssues', async () => {
    const text = `
john.doe@example.com

Summary
Experienced software engineer with strong skills in TypeScript and React.

Experience
- Led API development using Node.js and Docker.
`.trim();

    const result = await analyzeText(text);

    // All sentences in this text are short; none should be flagged
    const hasLongSentence = result.clarityIssues.some(
      (s) => s.split(/\s+/).length <= 30,
    );
    // clarityIssues should only contain sentences > 30 words
    for (const sentence of result.clarityIssues) {
      const wordCount = sentence.split(/\s+/).filter((w) => w.length > 0).length;
      expect(wordCount).toBeGreaterThan(30);
    }
  });

  // ── 8. issues.length === suggestions.length for any valid input ────────────

  it('produces equal numbers of issues and suggestions for a full resume', async () => {
    const result = await analyzeText(FULL_RESUME);
    expect(result.issues.length).toBe(result.suggestions.length);
  });

  it('produces equal numbers of issues and suggestions for a partial resume', async () => {
    const result = await analyzeText(PARTIAL_RESUME);
    expect(result.issues.length).toBe(result.suggestions.length);
  });

  it('produces equal numbers of issues and suggestions for a no-sections resume', async () => {
    const result = await analyzeText(NO_SECTIONS_TEXT);
    expect(result.issues.length).toBe(result.suggestions.length);
  });

  // ── 9. detectedSections ∪ missingSections always equals all 5 sections ────

  it('union of detectedSections and missingSections always equals all 5 sections', async () => {
    const allSections = ['contact', 'summary', 'experience', 'education', 'skills'];

    for (const text of [FULL_RESUME, PARTIAL_RESUME, NO_SECTIONS_TEXT]) {
      const result = await analyzeText(text);
      const union = [
        ...result.detectedSections,
        ...result.missingSections,
      ].sort();
      expect(union).toEqual([...allSections].sort());
    }
  });

  it('detectedSections and missingSections have no overlap', async () => {
    for (const text of [FULL_RESUME, PARTIAL_RESUME, NO_SECTIONS_TEXT]) {
      const result = await analyzeText(text);
      const intersection = result.detectedSections.filter((s) =>
        result.missingSections.includes(s),
      );
      expect(intersection).toHaveLength(0);
    }
  });

  // ── 10. Text with ATS keywords → keywordDensityScore > 0 ──────────────────

  it('produces a keywordDensityScore > 0 when ATS keywords are present', async () => {
    const text = `
john.doe@example.com

Skills
JavaScript TypeScript React Node SQL Docker AWS Git Agile Scrum API REST GraphQL Testing Leadership
`.trim();

    const result = await analyzeText(text);
    expect(result.keywordDensityScore).toBeGreaterThan(0);
  });

  it('produces keywordDensityScore of 0 when no ATS keywords are present', async () => {
    // Text with no ATS keywords but long enough to pass the guard.
    // Deliberately avoids all words in the ATS keyword list.
    const text =
      'This resume contains no relevant vocabulary from the curated list and is purely filler prose for verification of the zero-score branch.';

    const result = await analyzeText(text);
    expect(result.keywordDensityScore).toBe(0);
  });

  it('clamps keywordDensityScore to a maximum of 1.0', async () => {
    // Text with many ATS keywords should not exceed 1.0
    const result = await analyzeText(FULL_RESUME);
    expect(result.keywordDensityScore).toBeLessThanOrEqual(1.0);
    expect(result.keywordDensityScore).toBeGreaterThanOrEqual(0);
  });

  // ── Additional edge cases ──────────────────────────────────────────────────

  it('detects contact section via email pattern', async () => {
    const text =
      'user@example.com\n\nThis is a resume with enough text to pass the minimum length requirement for analysis.';
    const result = await analyzeText(text);
    expect(result.detectedSections).toContain('contact');
  });

  it('detects contact section via phone pattern', async () => {
    const text =
      '(555) 123-4567\n\nThis is a resume with enough text to pass the minimum length requirement for analysis.';
    const result = await analyzeText(text);
    expect(result.detectedSections).toContain('contact');
  });

  it('detects contact section via linkedin keyword', async () => {
    const text =
      'linkedin.com/in/johndoe\n\nThis is a resume with enough text to pass the minimum length requirement for analysis.';
    const result = await analyzeText(text);
    expect(result.detectedSections).toContain('contact');
  });

  it('flags all weak verb variants', async () => {
    const weakVerbBullets = [
      '- Worked on the backend API for the payment service',
      '- Assisted with the deployment pipeline configuration',
      '- Responsible for maintaining the CI/CD infrastructure',
      '- Participated in daily standups and sprint planning',
      '- Supported the QA team during regression testing',
    ].join('\n');

    const text = `john.doe@example.com\n\nExperience\n${weakVerbBullets}`;
    const result = await analyzeText(text);

    expect(result.weakBullets.length).toBe(5);
  });

  it('does not flag non-bullet lines as weak bullets', async () => {
    const text = `
john.doe@example.com

Summary
Helped build a strong team culture and supported organizational growth.

Experience
- Led the development of a new product feature.
`.trim();

    const result = await analyzeText(text);

    // The "helped" and "supported" are in a non-bullet line (Summary paragraph)
    // Only bullet lines should be checked
    const hasNonBulletFlagged = result.weakBullets.some(
      (b) => !b.startsWith('-') && !b.startsWith('•') && !b.startsWith('*') && !b.startsWith('–'),
    );
    expect(hasNonBulletFlagged).toBe(false);
  });
});
