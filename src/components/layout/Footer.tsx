import { Link } from 'react-router-dom';
import { FileText, Github, ExternalLink } from 'lucide-react';
export function Footer() {
  const currentYear = new Date().getFullYear();
  return <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo and tagline */}
          <div className="flex flex-col items-center gap-2 md:items-start">
            
            <p className="text-sm text-muted-foreground">© 2026 BioReport. Open source and self-hosted.
          </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a href="https://github.com/sergunik/bioreport" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </a>
            <a href="https://github.com/sergunik/bioreport/wiki" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ExternalLink className="h-4 w-4" />
              <span>Documentation</span>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} BioReport. Open source and self-hosted.
          </p>
        </div>
      </div>
    </footer>;
}