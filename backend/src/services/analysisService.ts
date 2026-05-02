import { AnalysisResult, SectionName } from '../types';
import { AppError } from './uploadService';

// ── Constants ────────────────────────────────────────────────────────────────

const ALL_SECTIONS: SectionName[] = [
  'contact',
  'summary',
  'experience',
  'education',
  'skills',
];

/**
 * Regex patterns for detecting each resume section.
 * Contact is detected by content patterns (email, phone, LinkedIn).
 * All others are detected by header keywords (case-insensitive).
 */
const SECTION_PATTERNS: Record<SectionName, RegExp> = {
  contact: /\S+@\S+\.\S+|\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}|linkedin/i,
  summary: /\b(summary|objective|profile)\b/i,
  experience: /\b(experience|employment|work\s+history)\b/i,
  education: /\b(education|degree|university)\b/i,
  skills: /\b(skills|technologies|competencies)\b/i,
};

/**
 * Weak action verb phrases to flag in bullet points.
 * Checked case-insensitively.
 */
const WEAK_VERBS: string[] = [
  'helped',
  'worked on',
  'assisted',
  'responsible for',
  'participated in',
  'supported',
  'was involved in',
  'contributed to',
];

/**
 * ATS-relevant keywords for keyword density scoring.
 */
const ATS_KEYWORDS: string[] = [
  'javascript',
  'typescript',
  'python',
  'java',
  'react',
  'node',
  'sql',
  'aws',
  'docker',
  'kubernetes',
  'git',
  'agile',
  'scrum',
  'api',
  'rest',
  'graphql',
  'ci/cd',
  'testing',
  'leadership',
  'communication',
  'project management',
  'data analysis',
  'machine learning',
  'cloud',
  'microservices',
  'devops',
  'html',
  'css',
  'mongodb',
  'postgresql',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Detects which of the five resume sections are present in the text.
 */
function detectSections(text: string): {
  detectedSections: SectionName[];
  missingSections: SectionName[];
} {
  const detectedSections: SectionName[] = [];
  const missingSections: SectionName[] = [];

  for (const section of ALL_SECTIONS) {
    if (SECTION_PATTERNS[section].test(text)) {
      detectedSections.push(section);
    } else {
      missingSections.push(section);
    }
  }

  return { detectedSections, missingSections };
}

/**
 * Finds bullet point lines and returns those containing weak action verbs.
 * Bullet lines start with -, •, *, or – (after trimming leading whitespace).
 */
function detectWeakBullets(text: string): string[] {
  const lines = text.split('\n');
  const weakBullets: string[] = [];

  for (const line of lines) {
    const trimmed = line.trimStart();
    // Check if line starts with a bullet character
    if (!/^[-•*–]/.test(trimmed)) {
      continue;
    }

    const lowerLine = trimmed.toLowerCase();
    const hasWeakVerb = WEAK_VERBS.some((verb) => lowerLine.includes(verb));
    if (hasWeakVerb) {
      weakBullets.push(trimmed);
    }
  }

  return weakBullets;
}

/**
 * Computes keyword density score: ratio of unique ATS keywords found to threshold.
 * Threshold = 10 keywords per 500 words, minimum 10.
 * Score is clamped to [0, 1].
 */
function computeKeywordDensity(text: string): number {
  const lowerText = text.toLowerCase();
  const wordCount = text.trim().split(/\s+/).length;

  const uniqueKeywordsFound = ATS_KEYWORDS.filter((keyword) =>
    lowerText.includes(keyword),
  ).length;

  const threshold = Math.max(10, Math.floor(wordCount / 500) * 10);
  return Math.min(uniqueKeywordsFound / threshold, 1.0);
}

/**
 * Finds sentences exceeding 30 words.
 * Splits on sentence-ending punctuation (., !, ?).
 */
function detectClarityIssues(text: string): string[] {
  const sentences = text
    .split(/[.!?]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return sentences.filter((sentence) => {
    const wordCount = sentence.split(/\s+/).filter((w) => w.length > 0).length;
    return wordCount > 30;
  });
}

/**
 * Builds the suggestion text for a missing section.
 */
function getSuggestionForMissingSection(section: SectionName): string {
  const suggestions: Record<SectionName, string> = {
    contact:
      'Add your contact information including email, phone number, and LinkedIn profile URL',
    summary:
      'Add a 2–3 line professional summary highlighting your key skills, experience, and career goals',
    experience:
      'Add a Work Experience section listing your roles, companies, dates, and key achievements',
    education:
      'Add an Education section with your degree, institution, and graduation year',
    skills:
      'Add a Skills section listing relevant technical and professional skills',
  };
  return suggestions[section];
}

// ── Main export ──────────────────────────────────────────────────────────────

/**
 * Analyzes resume plain text and produces an AnalysisResult.
 *
 * All processing is in-memory; nothing is written to disk (Requirement 10.2, 10.5).
 *
 * @param text - Plain text extracted from the resume
 * @returns AnalysisResult with section detection, bullet quality, keyword density,
 *          clarity issues, and corresponding issues/suggestions arrays
 * @throws AppError (422) if text is shorter than 50 characters after trimming
 */
export async function analyzeText(text: string): Promise<AnalysisResult> {
  // Guard: reject text that is too short to analyze (Requirement 3.6)
  if (text.trim().length < 50) {
    throw new AppError(
      'Resume content is too short to analyze. Please upload a complete resume.',
      422,
    );
  }

  // Section detection (Property 5)
  const { detectedSections, missingSections } = detectSections(text);

  // Bullet quality (Property 6)
  const weakBullets = detectWeakBullets(text);

  // Keyword density (Property 7)
  const keywordDensityScore = computeKeywordDensity(text);

  // Clarity (Property 8)
  const clarityIssues = detectClarityIssues(text);

  // Build issues and suggestions arrays — one suggestion per issue (Property 12)
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Missing section issues
  for (const section of missingSections) {
    const sectionLabel =
      section.charAt(0).toUpperCase() + section.slice(1);
    issues.push(`${sectionLabel} section is missing`);
    suggestions.push(getSuggestionForMissingSection(section));
  }

  // Weak bullet issue
  if (weakBullets.length > 0) {
    issues.push(
      `${weakBullets.length} bullet point(s) use weak action verbs`,
    );
    suggestions.push(
      "Rewrite experience bullet points with strong action verbs (e.g., 'Led', 'Built', 'Increased') and include measurable outcomes",
    );
  }

  // Low keyword density issue
  if (keywordDensityScore < 1.0) {
    issues.push('Resume has low keyword density for ATS systems');
    suggestions.push(
      'Add relevant technical and professional keywords from the job description to improve ATS matching',
    );
  }

  // Clarity issue
  if (clarityIssues.length > 0) {
    issues.push(
      `${clarityIssues.length} sentence(s) exceed 30 words and may reduce readability`,
    );
    suggestions.push(
      'Break long sentences into shorter, more impactful bullet points or statements',
    );
  }

  return {
    detectedSections,
    missingSections,
    weakBullets,
    keywordDensityScore,
    clarityIssues,
    issues,
    suggestions,
  };
}
