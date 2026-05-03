import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { useResume } from '../context/ResumeContext';

export function PageShell({ children, hideNav }: { children: ReactNode; hideNav?: boolean }) {
  const { user } = useResume();
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Animated background orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full bg-primary/30 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-40 w-[520px] h-[520px] rounded-full bg-accent/20 blur-3xl animate-blob [animation-delay:-4s]" />
        <div className="absolute bottom-0 left-1/3 w-[420px] h-[420px] rounded-full bg-primary-glow/20 blur-3xl animate-blob [animation-delay:-8s]" />
      </div>

      {!hideNav && (
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/40 border-b border-white/5">
          <div className="container flex items-center justify-between h-16">
            <Logo />
            <nav className="flex items-center gap-3 text-sm">
              {user && (
                <span className="text-muted-foreground hidden sm:inline">
                  Hi, <span className="text-foreground font-medium">{user.name}</span>
                </span>
              )}
              <Link to="/upload" className="text-muted-foreground hover:text-foreground transition">
                New scan
              </Link>
            </nav>
          </div>
        </header>
      )}

      <main className="relative">{children}</main>
    </div>
  );
}
