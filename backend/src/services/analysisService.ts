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
 * Stricter: requires actual section headers on their own line or followed by colon/newline.
 * Contact requires both email AND phone (or LinkedIn) to pass.
 */
const SECTION_PATTERNS: Record<SectionName, RegExp> = {
  contact: /(\S+@\S+\.\S+)[\s\S]{0,300}(\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}|linkedin\.com)/i,
  summary: /^[\s]*\b(summary|professional\s+summary|objective|career\s+objective|profile|about\s+me)\b[\s]*[:\n]/im,
  experience: /^[\s]*\b(experience|work\s+experience|employment|work\s+history|professional\s+experience)\b[\s]*[:\n]/im,
  education: /^[\s]*\b(education|academic|degree|qualifications)\b[\s]*[:\n]/im,
  skills: /^[\s]*\b(skills|technical\s+skills|core\s+competencies|technologies|competencies|expertise)\b[\s]*[:\n]/im,
};

/**
 * Weak action verb phrases to flag in bullet points.
 * Checked case-insensitively. Expanded list for stricter detection.
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
  'helped with',
  'worked with',
  'was part of',
  'involved in',
  'tasked with',
  'duties included',
  'helped to',
  'tried to',
  'attempted to',
  'worked alongside',
  'aided',
  'facilitated',
];

/**
 * ATS-relevant keywords for keyword density scoring.
 * Deliberately excludes ultra-common terms (html, css, git, communication)
 * so only resumes with real technical depth score well.
 */
const ATS_KEYWORDS: string[] = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'golang', 'rust',
  'react', 'angular', 'vue', 'next.js', 'node.js',
  'sql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
  'graphql', 'rest api', 'microservices', 'ci/cd', 'devops',
  'machine learning', 'deep learning', 'data analysis', 'data science',
  'agile', 'scrum', 'product management', 'project management',
  'system design', 'distributed systems', 'cloud architecture',
  'performance optimization', 'security', 'testing', 'tdd',
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
 * Computes keyword density score.
 * Threshold: 8 unique ATS keywords required for a score of 1.0.
 * Partial credit below that. Score clamped to [0, 1].
 * Harder than before — common resumes typically hit 3–5 keywords.
 */
function computeKeywordDensity(text: string): number {
  const lowerText = text.toLowerCase();

  const uniqueKeywordsFound = ATS_KEYWORDS.filter((keyword) =>
    lowerText.includes(keyword),
  ).length;

  // Require 8 distinct ATS keywords for full score (was 10 per 500 words but too easy)
  const threshold = 8;
  return Math.min(uniqueKeywordsFound / threshold, 1.0);
}

/**
 * Finds sentences exceeding 20 words (stricter than before — was 30).
 * Splits on sentence-ending punctuation (., !, ?).
 */
function detectClarityIssues(text: string): string[] {
  const sentences = text
    .split(/[.!?]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return sentences.filter((sentence) => {
    const wordCount = sentence.split(/\s+/).filter((w) => w.length > 0).length;
    return wordCount > 20;
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

  // Check for minimum bullet count — resumes need quantified achievements
  const allBullets = text.split('\n').filter(l => /^[\s]*[-•*–]/.test(l));
  if (allBullets.length < 4) {
    issues.push('Too few bullet points — resume lacks quantified achievements');
    suggestions.push(
      'Add at least 4–6 bullet points under your experience section with measurable outcomes (e.g., "Increased sales by 30%")',
    );
  }

  // Low keyword density issue
  if (keywordDensityScore < 0.75) {
    issues.push('Resume has low keyword density for ATS systems');
    suggestions.push(
      'Add relevant technical and professional keywords from the job description to improve ATS matching',
    );
  }

  // Clarity issue — stricter: flag even 1 long sentence
  if (clarityIssues.length > 0) {
    issues.push(
      `${clarityIssues.length} sentence(s) exceed 20 words and reduce readability`,
    );
    suggestions.push(
      'Break long sentences into concise bullet points — aim for under 20 words per statement',
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
