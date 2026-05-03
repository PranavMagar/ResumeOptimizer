import { createContext, useContext, useState, ReactNode } from 'react';

export type JobLevel = 'internship' | 'entry' | 'mid' | 'senior' | 'executive';

export type Profession =
  | 'software' | 'data' | 'design' | 'product' | 'marketing'
  | 'sales' | 'finance' | 'hr' | 'operations' | 'healthcare'
  | 'education' | 'customer' | 'other';

export interface SectionScore {
  name: string;
  score: number;
  status: 'good' | 'warn' | 'bad';
  note: string;
}

export interface AnalysisResult {
  score: number;
  issues: string[];
  suggestions: string[];
  rewrites: { summary: string; experience: string[]; coverLetter?: string };
  errors: string[];
  keywords: { matched: string[]; missing: string[] };
  sections: SectionScore[];
  jdMatch?: { score: number; matched: string[]; missing: string[] };
  readability: { words: number; bullets: number; quantified: number; readingTime: string };
}

interface ResumeCtx {
  file: File | null;
  setFile: (f: File | null) => void;
  jobLevel: JobLevel;
  setJobLevel: (l: JobLevel) => void;
  profession: Profession;
  setProfession: (p: Profession) => void;
  targetRole: string;
  setTargetRole: (r: string) => void;
  jobDescription: string;
  setJobDescription: (j: string) => void;
  result: AnalysisResult | null;
  setResult: (r: AnalysisResult | null) => void;
  user: { name: string; email: string } | null;
  setUser: (u: { name: string; email: string } | null) => void;
}

const Ctx = createContext<ResumeCtx | null>(null);

export const ResumeProvider = ({ children }: { children: ReactNode }) => {
  const [file, setFile] = useState<File | null>(null);
  const [jobLevel, setJobLevel] = useState<JobLevel>('mid');
  const [profession, setProfession] = useState<Profession>('software');
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
    const s = sessionStorage.getItem('aro_user');
    return s ? JSON.parse(s) : null;
  });

  const setUserPersisted = (u: { name: string; email: string } | null) => {
    setUser(u);
    if (u) sessionStorage.setItem('aro_user', JSON.stringify(u));
    else sessionStorage.removeItem('aro_user');
  };

  return (
    <Ctx.Provider value={{
      file, setFile,
      jobLevel, setJobLevel,
      profession, setProfession,
      targetRole, setTargetRole,
      jobDescription, setJobDescription,
      result, setResult,
      user, setUser: setUserPersisted,
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useResume = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useResume must be used inside ResumeProvider');
  return c;
};
