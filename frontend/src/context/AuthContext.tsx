import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem('aro_user');
    return stored ? JSON.parse(stored) : null;
  });

  async function login(email: string, _password: string) {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));
    const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const u = { name, email };
    setUser(u);
    sessionStorage.setItem('aro_user', JSON.stringify(u));
  }

  async function signup(name: string, email: string, _password: string) {
    await new Promise((r) => setTimeout(r, 800));
    const u = { name, email };
    setUser(u);
    sessionStorage.setItem('aro_user', JSON.stringify(u));
  }

  function logout() {
    setUser(null);
    sessionStorage.removeItem('aro_user');
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
