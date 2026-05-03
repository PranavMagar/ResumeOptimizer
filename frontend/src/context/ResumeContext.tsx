import { createContext, useContext, useState, ReactNode } from 'react';
import { ApiResponse } from '../types/api';

export type JobLevel = 'internship' | 'entry' | 'mid' | 'senior' | 'executive';

interface ResumeCtx {
  file: File | null;
  setFile: (f: File | null) => void;
  jobLevel: JobLevel;
  setJobLevel: (l: JobLevel) => void;
  result: ApiResponse | null;
  setResult: (r: ApiResponse | null) => void;
  user: { name: string; email: string } | null;
  setUser: (u: { name: string; email: string } | null) => void;
}

const Ctx = createContext<ResumeCtx | null>(null);

export const ResumeProvider = ({ children }: { children: ReactNode }) => {
  const [file, setFile] = useState<File | null>(null);
  const [jobLevel, setJobLevel] = useState<JobLevel>('mid');
  const [result, setResult] = useState<ApiResponse | null>(null);
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
    <Ctx.Provider value={{ file, setFile, jobLevel, setJobLevel, result, setResult, user, setUser: setUserPersisted }}>
      {children}
    </Ctx.Provider>
  );
};

export const useResume = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useResume must be used inside ResumeProvider');
  return c;
};
