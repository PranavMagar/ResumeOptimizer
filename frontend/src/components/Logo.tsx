import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export function Logo({ to = '/upload' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 group">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-primary blur-md opacity-60 group-hover:opacity-90 transition-opacity rounded-lg" />
        <div className="relative bg-gradient-primary p-2 rounded-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
      </div>
      <span className="font-display font-bold text-xl">
        Resume<span className="gradient-text">AI</span>
      </span>
    </Link>
  );
}
