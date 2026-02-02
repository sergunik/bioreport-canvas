import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Simple header with logo */}
      <header className="flex h-16 items-center justify-center border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">BioReport</span>
        </Link>
      </header>

      {/* Main content */}
      <main className={cn('flex flex-1 items-center justify-center px-4 py-12', className)}>
        {children}
      </main>

      {/* Simple footer */}
      <footer className="flex h-14 items-center justify-center border-t border-border">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} BioReport. Privacy-first health data management.
        </p>
      </footer>
    </div>
  );
}
