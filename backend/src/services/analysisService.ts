import { AnalysisResult, SectionName } from '../types';
import { AppError } from './uploadService';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AnalysisOptions {
  profession?: string;
  targetRole?: string;
  jobDescription?: string;
}

// ── Section detection ─────────────────────────────────────────────────────────

const ALL_SECTIONS: SectionName[] = ['contact', 'summary', 'experience', 'education', 'skills'];

const SECTION_PATTERNS: Record<Exclude<SectionName, 'contact'>, RegExp> = {
  summary: /^[\s]*\b(summary|professional\s+summary|objective|career\s+objective|profile|about\s+me)\b[\s]*[:\n]/im,
  experience: /^[\s]*\b(experience|work\s+experience|employment|work\s+history|professional\s+experience)\b[\s]*[:\n]/im,
  education: /^[\s]*\b(education|academic|degree|qualifications|university|college)\b[\s]*[:\n]/im,
  skills: /^[\s]*\b(skills|technical\s+skills|core\s+competencies|technologies|competencies|expertise|tools)\b[\s]*[:\n]/im,
};

// ── Role-specific keyword libraries ──────────────────────────────────────────

const ROLE_KEYWORDS: Record<string, { core: string[]; optional: string[] }> = {
  software: {
    core: ['javascript', 'typescript', 'python', 'java', 'react', 'node.js', 'rest api', 'git', 'sql', 'testing'],
    optional: ['docker', 'kubernetes', 'aws', 'ci/cd', 'graphql', 'microservices', 'system design', 'agile', 'tdd', 'redis'],
  },
  devops: {
    core: ['docker', 'kubernetes', 'ci/cd', 'terraform', 'aws', 'linux', 'bash', 'ansible', 'jenkins', 'monitoring'],
    optional: ['azure', 'gcp', 'helm', 'prometheus', 'grafana', 'nginx', 'git', 'python', 'security', 'infrastructure'],
  },
  data: {
    core: ['python', 'sql', 'pandas', 'machine learning', 'data analysis', 'statistics', 'tableau', 'spark', 'etl', 'modeling'],
    optional: ['tensorflow', 'pytorch', 'scikit-learn', 'airflow', 'snowflake', 'bigquery', 'r', 'a/b testing', 'visualization', 'nlp'],
  },
  design: {
    core: ['figma', 'user research', 'prototyping', 'wireframes', 'design system', 'usability', 'accessibility', 'interaction design', 'user flows', 'typography'],
    optional: ['sketch', 'adobe xd', 'motion design', 'design tokens', 'component library', 'a/b testing', 'heuristic evaluation', 'information architecture'],
  },
  product: {
    core: ['roadmap', 'user research', 'metrics', 'okrs', 'stakeholders', 'prioritization', 'discovery', 'go-to-market', 'kpi', 'agile'],
    optional: ['a/b testing', 'sql', 'jira', 'product strategy', 'competitive analysis', 'customer interviews', 'mvp', 'growth', 'retention'],
  },
  marketing: {
    core: ['seo', 'content marketing', 'analytics', 'campaigns', 'conversion', 'brand', 'social media', 'email marketing', 'growth', 'funnel'],
    optional: ['google analytics', 'hubspot', 'salesforce', 'paid ads', 'ctr', 'cac', 'ltv', 'copywriting', 'ab testing', 'crm'],
  },
  sales: {
    core: ['pipeline', 'quota', 'crm', 'prospecting', 'negotiation', 'closing', 'revenue', 'outbound', 'account management', 'salesforce'],
    optional: ['cold calling', 'discovery calls', 'objection handling', 'forecasting', 'upselling', 'cross-selling', 'enterprise sales', 'saas'],
  },
  finance: {
    core: ['financial modeling', 'forecasting', 'budgeting', 'excel', 'gaap', 'variance analysis', 'reconciliation', 'audit', 'compliance', 'valuation'],
    optional: ['sql', 'tableau', 'power bi', 'erp', 'sap', 'quickbooks', 'dcf', 'p&l', 'cash flow', 'risk management'],
  },
  hr: {
    core: ['recruiting', 'onboarding', 'performance management', 'employee engagement', 'compliance', 'hris', 'compensation', 'talent acquisition', 'diversity', 'policies'],
    optional: ['workday', 'bamboohr', 'succession planning', 'learning development', 'org design', 'change management', 'benefits', 'payroll'],
  },
  operations: {
    core: ['process improvement', 'supply chain', 'logistics', 'kpi', 'lean', 'vendor management', 'automation', 'project management', 'scheduling', 'inventory'],
    optional: ['six sigma', 'erp', 'sap', 'forecasting', 'procurement', 'quality assurance', 'risk management', 'cost reduction'],
  },
  healthcare: {
    core: ['patient care', 'clinical', 'ehr', 'hipaa', 'diagnosis', 'treatment', 'compliance', 'emr', 'triage', 'documentation'],
    optional: ['epic', 'cerner', 'icd-10', 'cpt codes', 'care coordination', 'quality improvement', 'infection control', 'medication management'],
  },
  education: {
    core: ['curriculum', 'lesson plans', 'assessment', 'classroom management', 'differentiation', 'pedagogy', 'student engagement', 'learning outcomes', 'feedback', 'collaboration'],
    optional: ['iep', 'google classroom', 'canvas', 'stem', 'project-based learning', 'formative assessment', 'data-driven instruction'],
  },
  customer: {
    core: ['customer success', 'onboarding', 'retention', 'nps', 'csat', 'renewals', 'escalations', 'playbooks', 'advocacy', 'support'],
    optional: ['salesforce', 'gainsight', 'zendesk', 'churn', 'expansion revenue', 'qbr', 'health score', 'product adoption'],
  },
  other: {
    core: ['communication', 'leadership', 'project management', 'problem solving', 'collaboration', 'analytical', 'strategic thinking', 'stakeholder management'],
    optional: ['microsoft office', 'presentation', 'reporting', 'budgeting', 'cross-functional', 'mentoring', 'process improvement'],
  },
};

// ── Contact extraction (content-based, not section-based) ────────────────────

/**
 * Scans the full resume text for contact details regardless of section headers.
 * Handles resumes where contact info is in the header with no "Contact" label.
 */
function extractContactDetails(text: string): import('../types').ContactDetails {
  // Email — RFC-compliant pattern
  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : undefined;

  // Phone — handles +1 (555) 123-4567, 555-123-4567, +91 9876543210, etc.
  const phoneMatch = text.match(/(\+?\d{1,3}[\s.\-]?)?(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/);
  const rawPhone = phoneMatch ? phoneMatch[0].replace(/\s/g, '') : undefined;
  // Validate: must have at least 10 digits
  const phone = rawPhone && (rawPhone.replace(/\D/g, '').length >= 10) ? rawPhone : undefined;

  // Professional links
  const links: string[] = [];
  const linkedInMatch = text.match(/linkedin\.com\/[^\s,)>"\]]+/i);
  if (linkedInMatch) links.push('https://' + linkedInMatch[0].replace(/^https?:\/\//i, ''));

  const githubMatch = text.match(/github\.com\/[^\s,)>"\]]+/i);
  if (githubMatch) links.push('https://' + githubMatch[0].replace(/^https?:\/\//i, ''));

  const leetcodeMatch = text.match(/leetcode\.com\/[^\s,)>"\]]+/i);
  if (leetcodeMatch) links.push('https://' + leetcodeMatch[0].replace(/^https?:\/\//i, ''));

  const portfolioMatch = text.match(/(?:portfolio|personal|website)[:\s]+https?:\/\/[^\s,)>"\]]+/i);
  if (portfolioMatch) {
    const urlPart = portfolioMatch[0].match(/https?:\/\/[^\s,)>"\]]+/i);
    if (urlPart) links.push(urlPart[0]);
  }

  // Score: email=5, phone=5, at least 1 link=5, max 15
  let score = 0;
  if (email) score += 5;
  if (phone) score += 5;
  if (links.length > 0) score += 5;

  return { email, phone, links, score };
}
const STRONG_VERBS = [
  'led', 'built', 'designed', 'developed', 'launched', 'shipped', 'architected',
  'increased', 'reduced', 'improved', 'optimized', 'scaled', 'delivered', 'managed',
  'created', 'implemented', 'drove', 'achieved', 'generated', 'saved', 'grew',
  'mentored', 'established', 'transformed', 'automated', 'migrated', 'deployed',
  'negotiated', 'secured', 'spearheaded', 'pioneered', 'streamlined', 'accelerated',
];

const WEAK_VERBS = [
  'helped', 'worked on', 'assisted', 'responsible for', 'participated in',
  'supported', 'was involved in', 'contributed to', 'helped with', 'worked with',
  'was part of', 'involved in', 'tasked with', 'duties included', 'tried to',
  'attempted to', 'worked alongside', 'aided', 'facilitated',
];

// Degree keywords for education scoring
const DEGREE_KEYWORDS = ['bachelor', 'master', 'phd', 'doctorate', 'b.s.', 'm.s.', 'b.a.', 'm.a.', 'mba', 'associate', 'diploma', 'degree'];
const INSTITUTION_KEYWORDS = ['university', 'college', 'institute', 'school', 'academy'];

// ── Section scoring ───────────────────────────────────────────────────────────

interface SectionScoreResult {
  score: number;
  status: 'good' | 'warn' | 'bad';
  note: string;
}

function scoreContact(text: string): SectionScoreResult {
  const details = extractContactDetails(text);
  const { email, phone, links } = details;
  const hasLinkedIn = links.some(l => l.includes('linkedin'));
  const hasGitHub = links.some(l => l.includes('github'));
  const hasLocation = /\b(new york|san francisco|london|remote|[a-z]{2,}[,\s]+[a-z]{2}\b)/i.test(text);

  let score = 0;
  const missing: string[] = [];

  if (email) score += 35; else missing.push('email');
  if (phone) score += 25; else missing.push('phone');
  if (hasLinkedIn) score += 20; else missing.push('LinkedIn');
  if (hasGitHub) score += 10;
  if (hasLocation) score += 10;

  score = Math.min(100, score);
  const status: 'good' | 'warn' | 'bad' = score >= 75 ? 'good' : score >= 50 ? 'warn' : 'bad';
  const note = score >= 75
    ? `Complete (${email ? 'email' : ''}${phone ? ', phone' : ''}${hasLinkedIn ? ', LinkedIn' : ''})`
    : `Missing: ${missing.join(', ')}`;

  return { score, status, note };
}

function scoreSummary(text: string, targetRole: string, matchedKeywords: string[]): SectionScoreResult {
  // Find the summary section text
  const summaryMatch = text.match(/\b(summary|professional\s+summary|objective|profile|about\s+me)\b[:\n]([\s\S]{0,500})/i);
  const summaryText = summaryMatch ? summaryMatch[2].toLowerCase() : '';

  if (!summaryText || summaryText.trim().length < 20) {
    return { score: 15, status: 'bad', note: 'Summary too short or missing content' };
  }

  let score = 40; // base for having a summary
  const wordCount = summaryText.trim().split(/\s+/).length;

  // Length check (ideal: 40–80 words)
  if (wordCount >= 30 && wordCount <= 100) score += 20;
  else if (wordCount >= 20) score += 10;

  // Keyword presence in summary
  const keywordsInSummary = matchedKeywords.filter(k => summaryText.includes(k.toLowerCase())).length;
  score += Math.min(20, keywordsInSummary * 5);

  // Target role mention
  if (targetRole && summaryText.includes(targetRole.toLowerCase())) score += 15;
  else if (targetRole) score += 5; // partial credit

  // Strong verbs or impact language
  const hasImpact = /\b(years|experience|expertise|proven|track record|delivered|led|built)\b/i.test(summaryText);
  if (hasImpact) score += 5;

  score = Math.min(100, score);
  const status = score >= 75 ? 'good' : score >= 50 ? 'warn' : 'bad';
  const note = score >= 75
    ? `Well-written (${wordCount} words, ${keywordsInSummary} keywords)`
    : score >= 50
      ? `Could be stronger — add role-specific keywords`
      : `Weak summary — expand with skills and impact`;

  return { score, status, note };
}

function scoreExperience(text: string): SectionScoreResult {
  const lines = text.split('\n');
  const bulletLines = lines.filter(l => /^[\s]*[-•*–·▪►]/.test(l));
  const bulletCount = bulletLines.length;

  if (bulletCount === 0) {
    return { score: 20, status: 'bad', note: 'No bullet points detected — add achievements' };
  }

  let score = 30; // base for having experience

  // Bullet count scoring (ideal: 6–15 bullets)
  if (bulletCount >= 8) score += 20;
  else if (bulletCount >= 5) score += 15;
  else if (bulletCount >= 3) score += 8;

  // Strong action verbs
  const lowerText = text.toLowerCase();
  const strongVerbCount = STRONG_VERBS.filter(v => lowerText.includes(v)).length;
  score += Math.min(20, strongVerbCount * 3);

  // Weak verb penalty
  const weakVerbCount = WEAK_VERBS.filter(v => lowerText.includes(v)).length;
  score -= Math.min(15, weakVerbCount * 5);

  // Quantified achievements (numbers, %, $)
  const quantifiedCount = (text.match(/\b\d[\d,.]*\s*(%|percent|x|k\b|\$|million|billion|users|customers|engineers|days|hours|weeks)/gi) || []).length;
  score += Math.min(20, quantifiedCount * 5);

  // Date ranges (shows tenure)
  const hasDates = /\b(20\d{2}|19\d{2})\b/.test(text);
  if (hasDates) score += 10;

  score = Math.max(0, Math.min(100, score));
  const status = score >= 75 ? 'good' : score >= 50 ? 'warn' : 'bad';
  const note = score >= 75
    ? `Strong (${bulletCount} bullets, ${quantifiedCount} quantified)`
    : score >= 50
      ? `${bulletCount} bullets — add more measurable outcomes`
      : `Weak — use strong verbs and quantify achievements`;

  return { score, status, note };
}

function scoreEducation(text: string): SectionScoreResult {
  const lower = text.toLowerCase();
  const hasDegree = DEGREE_KEYWORDS.some(d => lower.includes(d));
  const hasInstitution = INSTITUTION_KEYWORDS.some(i => lower.includes(i));
  const hasYear = /\b(20\d{2}|19\d{2})\b/.test(text);
  const hasGPA = /\b(gpa|grade|cgpa)\b/i.test(text);
  const hasMajor = /\b(computer science|engineering|business|mathematics|physics|economics|finance|marketing|design|psychology|biology|chemistry)\b/i.test(lower);

  let score = 0;
  if (hasDegree) score += 40;
  if (hasInstitution) score += 25;
  if (hasYear) score += 15;
  if (hasMajor) score += 15;
  if (hasGPA) score += 5;

  score = Math.min(100, score);
  const status = score >= 75 ? 'good' : score >= 40 ? 'warn' : 'bad';
  const note = score >= 75
    ? `Complete (degree, institution, year)`
    : score >= 40
      ? `Partial — add ${!hasDegree ? 'degree name' : !hasInstitution ? 'institution' : 'graduation year'}`
      : `Incomplete — add degree, institution, and year`;

  return { score, status, note };
}

function scoreSkills(text: string, matchedKeywords: string[], totalKeywords: number): SectionScoreResult {
  // Find skills section text
  const skillsMatch = text.match(/\b(skills|technical\s+skills|technologies|competencies|expertise|tools)\b[:\n]([\s\S]{0,600})/i);
  const skillsText = skillsMatch ? skillsMatch[2].toLowerCase() : text.toLowerCase();

  const keywordsInSkills = matchedKeywords.filter(k => skillsText.includes(k.toLowerCase())).length;
  const coverage = totalKeywords > 0 ? keywordsInSkills / totalKeywords : 0;

  // Count comma/bullet separated items as skill count
  const skillItems = skillsText.split(/[,\n•\-|\/]/).filter(s => s.trim().length > 2).length;

  let score = 0;
  score += Math.min(50, Math.round(coverage * 60)); // keyword coverage
  if (skillItems >= 10) score += 25;
  else if (skillItems >= 6) score += 15;
  else if (skillItems >= 3) score += 8;

  // Bonus for organized categories
  const hasCategories = /\b(languages|frameworks|tools|databases|cloud|soft skills|certifications)\b/i.test(text);
  if (hasCategories) score += 15;

  // Bonus for certifications
  const hasCerts = /\b(certified|certification|aws certified|google certified|pmp|cpa|cfa|cissp)\b/i.test(skillsText);
  if (hasCerts) score += 10;

  score = Math.min(100, score);
  const status = score >= 75 ? 'good' : score >= 45 ? 'warn' : 'bad';
  const note = score >= 75
    ? `Strong (${keywordsInSkills}/${totalKeywords} role keywords, ${skillItems} skills)`
    : score >= 45
      ? `${keywordsInSkills}/${totalKeywords} role keywords — add more relevant skills`
      : `Weak — align skills with target role keywords`;

  return { score, status, note };
}

// ── Keyword matching ──────────────────────────────────────────────────────────

function getRoleKeywords(profession: string, jobDescription: string): { core: string[]; optional: string[] } {
  const normalized = profession.toLowerCase().trim();

  // Map common variations
  const professionMap: Record<string, string> = {
    'software engineer': 'software', 'software developer': 'software', 'frontend': 'software',
    'backend': 'software', 'fullstack': 'software', 'full stack': 'software',
    'devops': 'devops', 'sre': 'devops', 'platform engineer': 'devops', 'cloud engineer': 'devops',
    'data scientist': 'data', 'data analyst': 'data', 'data engineer': 'data', 'ml engineer': 'data',
    'ux designer': 'design', 'ui designer': 'design', 'product designer': 'design',
    'product manager': 'product', 'product owner': 'product',
    'marketing manager': 'marketing', 'growth': 'marketing',
    'sales': 'sales', 'account executive': 'sales', 'business development': 'sales',
    'finance': 'finance', 'financial analyst': 'finance', 'accountant': 'finance',
    'hr': 'hr', 'recruiter': 'hr', 'people ops': 'hr',
    'operations': 'operations', 'ops manager': 'operations',
    'healthcare': 'healthcare', 'nurse': 'healthcare', 'doctor': 'healthcare',
    'teacher': 'education', 'educator': 'education',
    'customer success': 'customer', 'customer support': 'customer',
  };

  let key = normalized;
  for (const [pattern, mapped] of Object.entries(professionMap)) {
    if (normalized.includes(pattern)) { key = mapped; break; }
  }

  const base = ROLE_KEYWORDS[key] ?? ROLE_KEYWORDS['other'];

  // If job description provided, extract additional keywords from it
  if (jobDescription && jobDescription.trim().length > 50) {
    const jdLower = jobDescription.toLowerCase();
    const allKnownKeywords = Object.values(ROLE_KEYWORDS).flatMap(r => [...r.core, ...r.optional]);
    const jdKeywords = allKnownKeywords.filter(k => jdLower.includes(k));
    const extraCore = jdKeywords.filter(k => !base.core.includes(k)).slice(0, 5);
    return {
      core: [...base.core, ...extraCore],
      optional: base.optional,
    };
  }

  return base;
}

function computeKeywordDensity(
  text: string,
  profession: string,
  jobDescription: string,
): { score: number; matched: string[]; missing: string[]; matchedCore: string[]; missingCore: string[] } {
  const lowerText = text.toLowerCase();
  const { core, optional } = getRoleKeywords(profession, jobDescription);
  const allKeywords = [...core, ...optional];

  const matched = allKeywords.filter(k => lowerText.includes(k));
  const missing = allKeywords.filter(k => !lowerText.includes(k));
  const matchedCore = core.filter(k => lowerText.includes(k));
  const missingCore = core.filter(k => !lowerText.includes(k));

  // Score weighted toward core keywords (core = 70%, optional = 30%)
  const coreScore = core.length > 0 ? matchedCore.length / core.length : 0;
  const optionalMatched = optional.filter(k => lowerText.includes(k)).length;
  const optionalScore = optional.length > 0 ? optionalMatched / optional.length : 0;
  const score = Math.min(1.0, coreScore * 0.7 + optionalScore * 0.3);

  return { score, matched, missing, matchedCore, missingCore };
}

// ── Weak bullet detection ─────────────────────────────────────────────────────

function detectWeakBullets(text: string): string[] {
  const lines = text.split('\n');
  const weakBullets: string[] = [];
  for (const line of lines) {
    const trimmed = line.trimStart();
    if (!/^[-•*–·▪►]/.test(trimmed)) continue;
    const lowerLine = trimmed.toLowerCase();
    if (WEAK_VERBS.some(v => lowerLine.includes(v))) {
      weakBullets.push(trimmed);
    }
  }
  return weakBullets;
}

// ── Clarity detection ─────────────────────────────────────────────────────────

function detectClarityIssues(text: string): string[] {
  return text
    .split(/[.!?]/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .filter(s => s.split(/\s+/).filter(w => w.length > 0).length > 20);
}

// ── Section suggestion helpers ────────────────────────────────────────────────

function getSuggestionForMissingSection(section: SectionName): string {
  const suggestions: Record<SectionName, string> = {
    contact: 'Add your contact information: email, phone number, and LinkedIn profile URL',
    summary: 'Add a 2–3 line professional summary highlighting your key skills, experience, and career goals',
    experience: 'Add a Work Experience section listing your roles, companies, dates, and key achievements',
    education: 'Add an Education section with your degree, institution, and graduation year',
    skills: 'Add a Skills section listing relevant technical and professional skills aligned with your target role',
  };
  return suggestions[section];
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function analyzeText(text: string, options: AnalysisOptions = {}): Promise<AnalysisResult> {
  if (text.trim().length < 50) {
    throw new AppError('Resume content is too short to analyze. Please upload a complete resume.', 422);
  }

  const { profession = 'other', targetRole = '', jobDescription = '' } = options;

  // Section detection — contact is content-based, others are header-based
  const detectedSections: SectionName[] = [];
  const missingSections: SectionName[] = [];

  // Contact: scan entire text for email/phone (no section header required)
  const contactDetails = extractContactDetails(text);
  if (contactDetails.email || contactDetails.phone) {
    detectedSections.push('contact');
  } else {
    missingSections.push('contact');
  }

  // Other sections: require a section header
  const otherSections: Exclude<SectionName, 'contact'>[] = ['summary', 'experience', 'education', 'skills'];
  for (const section of otherSections) {
    if (SECTION_PATTERNS[section].test(text)) detectedSections.push(section);
    else missingSections.push(section);
  }

  // Role-aware keyword matching
  const { score: keywordDensityScore, matched: matchedKeywords, missing: missingKeywords } =
    computeKeywordDensity(text, profession, jobDescription);

  const { core } = getRoleKeywords(profession, jobDescription);

  // Weak bullets
  const weakBullets = detectWeakBullets(text);

  // Clarity
  const clarityIssues = detectClarityIssues(text);

  // ── Build issues and suggestions ──────────────────────────────────────────

  const issues: string[] = [];
  const suggestions: string[] = [];

  // Missing sections — use specific contact feedback
  for (const section of missingSections) {
    const label = section.charAt(0).toUpperCase() + section.slice(1);
    if (section === 'contact') {
      const missing: string[] = [];
      if (!contactDetails.email) missing.push('email address');
      if (!contactDetails.phone) missing.push('phone number');
      if (contactDetails.links.length === 0) missing.push('LinkedIn/GitHub profile');
      issues.push(`Contact info incomplete — missing: ${missing.join(', ')}`);
      suggestions.push('Add your email, phone number, and LinkedIn URL to the top of your resume');
    } else {
      issues.push(`${label} section is missing`);
      suggestions.push(getSuggestionForMissingSection(section));
    }
  }

  // Weak bullets
  if (weakBullets.length > 0) {
    issues.push(`${weakBullets.length} bullet point(s) use weak action verbs`);
    suggestions.push("Replace weak verbs (e.g., 'helped', 'assisted') with strong action verbs like 'Led', 'Built', 'Increased' and add measurable outcomes");
  }

  // Bullet count
  const allBullets = text.split('\n').filter(l => /^[\s]*[-•*–·▪►]/.test(l));
  if (allBullets.length < 4) {
    issues.push('Too few bullet points — resume lacks quantified achievements');
    suggestions.push('Add at least 4–6 bullet points per role with measurable outcomes (e.g., "Increased performance by 40%")');
  }

  // Missing core keywords
  const { missingCore } = computeKeywordDensity(text, profession, jobDescription);
  if (missingCore.length > Math.ceil(core.length * 0.4)) {
    issues.push(`Missing ${missingCore.length} core ${profession} keywords`);
    suggestions.push(`Add role-specific keywords: ${missingCore.slice(0, 5).join(', ')}`);
  }

  // Clarity
  if (clarityIssues.length > 0) {
    issues.push(`${clarityIssues.length} sentence(s) exceed 20 words and reduce readability`);
    suggestions.push('Break long sentences into concise bullet points — aim for under 20 words per statement');
  }

  // No quantified achievements
  const quantifiedCount = (text.match(/\b\d[\d,.]*\s*(%|percent|x|k\b|\$|million|billion|users|customers|engineers|days|hours|weeks)/gi) || []).length;
  if (quantifiedCount < 2) {
    issues.push('Few or no quantified achievements detected');
    suggestions.push('Add metrics to your bullets: percentages, dollar amounts, team sizes, or time saved (e.g., "Reduced load time by 60%")');
  }

  return {
    detectedSections,
    missingSections,
    weakBullets,
    keywordDensityScore,
    clarityIssues,
    matchedKeywords,
    missingKeywords,
    contactDetails,
    issues,
    suggestions,
  };
}

// Export for use in resultRenderer
export { scoreContact, scoreSummary, scoreExperience, scoreEducation, scoreSkills, getRoleKeywords };
