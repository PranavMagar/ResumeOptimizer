// ApiResponse mirrors the backend contract exactly.
// This is the shape returned by POST /api/analyze.
export interface ApiResponse {
  score: number;
  issues: string[];
  suggestions: string[];
  rewrites: {
    summary?: string;
    experience?: string[];
  };
  errors: string[];
}
