import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, User, Settings, LogOut, Shield, FileText } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = isAuthenticated
    ? [
        { label: t('nav.dashboard'), href: '/dashboard' },
        { label: t('nav.settings'), href: '/settings' },
      ]
    : [];

  const isActiveRoute = (href: string) => location.pathname === href;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">BioReport</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                isActiveRoute(item.href)
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side - Auth buttons or User menu */}
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="hidden text-sm font-medium md:inline">
                    {user?.email || 'Account'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  {t('nav.profile')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings/security')}>
                  <Shield className="mr-2 h-4 w-4" />
                  {t('nav.security')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t('nav.settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                {t('nav.login')}
              </Button>
              <Button onClick={() => navigate('/register')}>
                {t('nav.register')}
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="container mx-auto flex flex-col gap-2 px-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActiveRoute(item.href)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
            {isAuthenticated && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="rounded-md px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-accent"
              >
                {t('nav.logout')}
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
