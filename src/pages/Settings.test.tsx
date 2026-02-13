import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Settings from './Settings';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'settings.title': 'Settings',
        'settings.profile.title': 'Profile',
        'settings.security.title': 'Security',
        'settings.dangerZone.title': 'Danger Zone',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('@/components/layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>,
  PageContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="page-container">{children}</div>,
}));

function renderSettings(initialPath = '/settings') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/settings" element={<Settings />}>
          <Route path="profile" element={<div>Profile Settings</div>} />
          <Route path="security" element={<div>Security Settings</div>} />
          <Route path="danger" element={<div>Danger Zone</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('Settings', () => {
  it('renders the settings page title', () => {
    renderSettings();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders all navigation links', () => {
    renderSettings();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
  });

  it('renders profile settings when navigating to /settings/profile', () => {
    renderSettings('/settings/profile');
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
  });

  it('renders security settings when navigating to /settings/security', () => {
    renderSettings('/settings/security');
    expect(screen.getByText('Security Settings')).toBeInTheDocument();
  });

  it('renders danger zone when navigating to /settings/danger', () => {
    renderSettings('/settings/danger');
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
  });

  it('applies active styling to profile link when on profile page', () => {
    renderSettings('/settings/profile');
    const profileLink = screen.getByText('Profile').closest('a');
    expect(profileLink).toHaveClass('bg-secondary', 'text-foreground');
  });

  it('applies active styling to profile link when on base settings path', () => {
    renderSettings('/settings');
    const profileLink = screen.getByText('Profile').closest('a');
    expect(profileLink).toHaveClass('bg-secondary', 'text-foreground');
  });

  it('applies danger styling to danger zone link', () => {
    renderSettings();
    const dangerLink = screen.getByText('Danger Zone').closest('a');
    expect(dangerLink?.className).toContain('hover:bg-destructive/10');
    expect(dangerLink?.className).toContain('hover:text-destructive');
  });

  it('applies active danger styling when on danger zone page', () => {
    renderSettings('/settings/danger');
    const dangerLink = screen.getByText('Danger Zone').closest('a');
    expect(dangerLink).toHaveClass('bg-destructive/10', 'text-destructive');
  });

  it('wraps content in MainLayout and PageContainer', () => {
    renderSettings();
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    expect(screen.getByTestId('page-container')).toBeInTheDocument();
  });

  it('renders navigation icons', () => {
    const { container } = renderSettings();
    // lucide-react icons are rendered as svg elements
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('renders Outlet for nested routes', () => {
    renderSettings('/settings/profile');
    // Outlet should render the nested route content
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
  });
});