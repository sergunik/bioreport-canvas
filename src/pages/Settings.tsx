import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Shield, AlertTriangle } from 'lucide-react';

import { MainLayout, PageContainer } from '@/components/layout';
import { cn } from '@/lib/utils';

const settingsNav = [
  {
    href: '/settings/profile',
    labelKey: 'settings.profile.title',
    icon: User,
  },
  {
    href: '/settings/security',
    labelKey: 'settings.security.title',
    icon: Shield,
  },
  {
    href: '/settings/danger',
    labelKey: 'settings.dangerZone.title',
    icon: AlertTriangle,
    danger: true,
  },
];

export default function Settings() {
  const { t } = useTranslation();
  const location = useLocation();

  // Redirect to profile if on base settings path
  const isBasePath = location.pathname === '/settings';

  return (
    <MainLayout>
      <PageContainer size="xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {t('settings.title')}
          </h1>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar Navigation */}
          <nav className="w-full shrink-0 lg:w-64">
            <div className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:gap-1">
              {settingsNav.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                      isActive || (isBasePath && item.href === '/settings/profile')
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                      item.danger && 'hover:bg-destructive/10 hover:text-destructive',
                      item.danger &&
                        (location.pathname === item.href) &&
                        'bg-destructive/10 text-destructive'
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{t(item.labelKey)}</span>
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Content Area */}
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </PageContainer>
    </MainLayout>
  );
}

export function ProfileSettings() {
  return <div>Profile settings page coming soon.</div>;
}

export function SecuritySettings() {
  return <div>Security settings page coming soon.</div>;
}

export function DangerZone() {
  return <div>Danger zone settings page coming soon.</div>;
}
