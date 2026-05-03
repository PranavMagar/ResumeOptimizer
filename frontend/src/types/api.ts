export type SectionName = 'contact' | 'summary' | 'experience' | 'education' | 'skills';

export interface ApiResponse {
  score: number;
  issues: string[];
  suggestions: string[];
  rewrites: {
    summary?: string;
    experience?: string[];
  };
  errors: string[];
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
}
