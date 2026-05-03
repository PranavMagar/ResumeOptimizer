import { ScoreResult, AnalysisResult, RewriteResult, ServiceError, ApiResponse } from '../types';
import {
  scoreContact, scoreSummary, scoreExperience, scoreEducation, scoreSkills, getRoleKeywords,
} from './analysisService';

/**
 * Builds differentiated section scores based on actual content analysis.
 * Contact uses content-based detection (email/phone/links), not section headers.
 */
function buildSections(analysis: AnalysisResult, rawText: string, profession: string, targetRole: string) {
  const { detectedSections, matchedKeywords, contactDetails } = analysis;
  const { core } = getRoleKeywords(profession, '');

  // Contact: always score from contactDetails (content-based)
  const contactScore = (() => {
    const { email, phone, links } = contactDetails;
    const hasLinkedIn = links.some(l => l.includes('linkedin'));
    const hasGitHub = links.some(l => l.includes('github'));
    const hasLocation = /\b(new york|san francisco|london|remote|[a-z]{2,}[,\s]+[a-z]{2}\b)/i.test(rawText);
    let s = 0;
    const missing: string[] = [];
    if (email) s += 35; else missing.push('email');
    if (phone) s += 25; else missing.push('phone');
    if (hasLinkedIn) s += 20; else missing.push('LinkedIn');
    if (hasGitHub) s += 10;
    if (hasLocation) s += 10;
    s = Math.min(100, s);
    const status: 'good' | 'warn' | 'bad' = s >= 75 ? 'good' : s >= 50 ? 'warn' : 'bad';
    const note = s >= 75
      ? `Complete (${[email ? 'email' : '', phone ? 'phone' : '', hasLinkedIn ? 'LinkedIn' : ''].filter(Boolean).join(', ')})`
      : `Missing: ${missing.join(', ')}`;
    return { score: s, status, note };
  })();

  return [
    { name: 'Contact', ...contactScore },
    {
      name: 'Summary',
      ...(detectedSections.includes('summary')
        ? scoreSummary(rawText, targetRole, matchedKeywords)
        : { score: 0, status: 'bad' as const, note: 'Missing — add a professional summary' }),
    },
    {
      name: 'Experience',
      ...(detectedSections.includes('experience')
        ? scoreExperience(rawText)
        : { score: 0, status: 'bad' as const, note: 'Missing — add work experience' }),
    },
    {
      name: 'Education',
      ...(detectedSections.includes('education')
        ? scoreEducation(rawText)
        : { score: 0, status: 'bad' as const, note: 'Missing — add education details' }),
    },
    {
      name: 'Skills',
      ...(detectedSections.includes('skills')
        ? scoreSkills(rawText, matchedKeywords, core.length)
        : { score: 0, status: 'bad' as const, note: 'Missing — add a skills section' }),
    },
  ];
}

function buildCoverLetter(summary?: string): string {
  return `Dear Hiring Team,

I'm excited to apply for this role. ${summary ?? 'With a strong background in my field, I am confident I can contribute meaningfully from day one.'}

I take pride in pairing strong execution with measurable impact, and I'm drawn to the opportunity to grow alongside talented colleagues.

I'd welcome the chance to discuss how my experience aligns with your needs. Thank you for your consideration.

Sincerely,
{Your Name}`;
}

/**
 * Builds accurate readability stats from the actual parsed resume text.
 */
function buildReadability(rawText: string) {
  const words = (rawText.match(/\S+/g) ?? []).length;
  const bullets = (rawText.match(/(^|\n)\s*[-•*–·▪►]\s/g) ?? []).length;
  const quantified = (rawText.match(/\b\d[\d,.]*\s*(%|percent|x\b|\$|million|billion|k\b|users|customers|engineers|days|hours|weeks)/gi) ?? []).length;
  const readingTime = words < 400
    ? `${Math.max(10, Math.round((words / 400) * 60))} sec`
    : `${Math.round(words / 400)} min`;
  return { words, bullets, quantified, readingTime };
}

export function renderResult(
  score: ScoreResult | null,
  analysis: AnalysisResult | null,
  rewrites: RewriteResult | null,
  serviceErrors: ServiceError[],
  rawText = '',
  profession = 'other',
  targetRole = '',
): ApiResponse {
  const errors: string[] = [];

  for (const serviceError of serviceErrors) {
    errors.push(serviceError.message);
  }
  if (rewrites?.aiError) {
    errors.push(rewrites.aiError);
  }

  const responseScore = score?.score ?? 0;
  const responseIssues = analysis?.issues ?? [];
  const responseSuggestions = analysis?.suggestions ?? [];
  const responseRewrites = rewrites?.rewrites ?? {};
  const coverLetter = responseRewrites.coverLetter ?? buildCoverLetter(responseRewrites.summary);

  const apiResponse: ApiResponse = {
    score: responseScore,
    issues: responseIssues,
    suggestions: responseSuggestions,
    rewrites: {
      summary: responseRewrites.summary,
      experience: responseRewrites.experience,
      coverLetter,
    },
    errors,
    criteria: {
      detectedSections: analysis?.detectedSections ?? [],
      missingSections: analysis?.missingSections ?? [],
      weakBullets: analysis?.weakBullets ?? [],
      keywordDensityScore: analysis?.keywordDensityScore ?? 0,
      clarityIssues: analysis?.clarityIssues ?? [],
      breakdown: score?.breakdown ?? {
        structure: 0, keywords: 0, bullets: 0, educationContact: 0, clarity: 0,
      },
    },
    keywords: {
      matched: analysis?.matchedKeywords ?? [],
      missing: analysis?.missingKeywords ?? [],
    },
    sections: analysis ? buildSections(analysis, rawText, profession, targetRole) : [],
    readability: rawText ? buildReadability(rawText) : { words: 0, bullets: 0, quantified: 0, readingTime: '—' },
  };

  return apiResponse;
}
