// Upload_Service output
export interface UploadResult {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
}

// Parser_Service output
export interface ParseResult {
  text: string; // plain text, preserving line order
}

// Analysis_Service output
export type SectionName = 'contact' | 'summary' | 'experience' | 'education' | 'skills';

export interface AnalysisResult {
  detectedSections: SectionName[];
  missingSections: SectionName[];
  weakBullets: string[];
  keywordDensityScore: number; // 0.0–1.0 (1.0 = threshold met)
  clarityIssues: string[];     // sentences > 20 words
  matchedKeywords: string[];   // ATS keywords found in resume
  missingKeywords: string[];   // ATS keywords not found
  issues: string[];
  suggestions: string[];
}

// Scoring_Engine output
export interface ScoreResult {
  score: number; // integer, 0–100 inclusive (enforced at runtime)
  breakdown: {
    structure: number;        // 0–25
    keywords: number;         // 0–20
    bullets: number;          // 0–25
    educationContact: number; // 0–15
    clarity: number;          // 0–15
  };
}

// AI_Rewrite_Service output
export interface RewriteResult {
  rewrites: {
    summary?: string;
    experience?: string[];
    coverLetter?: string;
  };
  aiError?: string;
}

// ServiceError (internal) — message must be user-facing only, no stack traces
export interface ServiceError {
  service: 'parser' | 'analysis' | 'scoring' | 'rewrite';
  message: string; // user-facing, no stack traces
}

// Final API response
export interface ApiResponse {
  score: number;
  issues: string[];
  suggestions: string[];
  rewrites: {
    summary?: string;
    experience?: string[];
    coverLetter?: string;
  };
  errors: string[];
  // Criteria breakdown for split-screen scorecard
  criteria: {
    detectedSections: SectionName[];
    missingSections: SectionName[];
    weakBullets: string[];
    keywordDensityScore: number;
    clarityIssues: string[];
    breakdown: {
      structure: number;
      keywords: number;
      bullets: number;
      educationContact: number;
      clarity: number;
    };
  };
  keywords: {
    matched: string[];
    missing: string[];
  };
  sections: Array<{
    name: string;
    score: number;
    status: 'good' | 'warn' | 'bad';
    note: string;
  }>;
  readability: {
    words: number;
    bullets: number;
    quantified: number;
    readingTime: string;
  };
}
