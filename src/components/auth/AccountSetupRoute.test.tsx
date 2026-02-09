import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { AccountSetupRoute } from './AccountSetupRoute';

const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderWithRoute(initialPath = '/account-setup') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AccountSetupRoute />}>
          <Route path="/account-setup" element={<div>Account Setup Page</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AccountSetupRoute', () => {
  it('renders children when authenticated without completed setup', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasCompletedSetup: false,
    });

    renderWithRoute();
    expect(screen.getByText('Account Setup Page')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      hasCompletedSetup: false,
    });

    renderWithRoute();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('redirects to /dashboard when setup is already completed', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasCompletedSetup: true,
    });

    renderWithRoute();
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      hasCompletedSetup: false,
    });

    renderWithRoute();
    expect(screen.queryByText('Account Setup Page')).not.toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
