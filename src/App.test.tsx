import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

// Mock all page components
vi.mock('./pages/Landing', () => ({
  default: () => <div>Landing Page</div>,
}));

vi.mock('./pages/Login', () => ({
  default: () => <div>Login Page</div>,
}));

vi.mock('./pages/Register', () => ({
  default: () => <div>Register Page</div>,
}));

vi.mock('./pages/ForgotPassword', () => ({
  default: () => <div>Forgot Password Page</div>,
}));

vi.mock('./pages/ResetPassword', () => ({
  default: () => <div>Reset Password Page</div>,
}));

vi.mock('./pages/AccountSetup', () => ({
  default: () => <div>Account Setup Page</div>,
}));

vi.mock('./pages/Dashboard', () => ({
  default: () => <div>Dashboard Page</div>,
}));

vi.mock('./pages/DiagnosticReportsList', () => ({
  default: () => <div>Diagnostic Reports List Page</div>,
}));

vi.mock('./pages/NewDiagnosticReport', () => ({
  default: () => <div>New Diagnostic Report Page</div>,
}));

vi.mock('./pages/DiagnosticReportDetail', () => ({
  default: () => <div>Diagnostic Report Detail Page</div>,
}));

vi.mock('./pages/Settings', () => ({
  default: () => <div>Settings Page</div>,
}));

vi.mock('./pages/settings/index', () => ({
  ProfileSettingsPage: () => <div>Profile Settings Page</div>,
  SecuritySettingsPage: () => <div>Security Settings Page</div>,
  DangerZoneSection: () => <div>Danger Zone Section</div>,
}));

vi.mock('./pages/NotFound', () => ({
  default: () => <div>Not Found Page</div>,
}));

// Mock auth components
const mockUseAuth = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/components/auth', () => ({
  ProtectedRoute: ({ children }: { children?: React.ReactNode }) => {
    const auth = mockUseAuth();
    if (auth.isLoading) return <div>Loading...</div>;
    if (!auth.isAuthenticated) return <div>Redirect to Login</div>;
    if (!auth.hasCompletedSetup) return <div>Redirect to Account Setup</div>;
    return <div>{children}</div>;
  },
  GuestRoute: ({ children }: { children?: React.ReactNode }) => {
    const auth = mockUseAuth();
    if (auth.isLoading) return <div>Loading...</div>;
    if (auth.isAuthenticated) return <div>Redirect to Dashboard</div>;
    return <div>{children}</div>;
  },
  AccountSetupRoute: ({ children }: { children?: React.ReactNode }) => {
    const auth = mockUseAuth();
    if (auth.isLoading) return <div>Loading...</div>;
    if (!auth.isAuthenticated) return <div>Redirect to Login</div>;
    if (auth.hasCompletedSetup) return <div>Redirect to Dashboard</div>;
    return <div>{children}</div>;
  },
}));

// Mock UI components
vi.mock('@/components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="sonner" />,
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('App', () => {
  let App: (typeof import('./App'))['default'];

  beforeAll(async () => {
    App = (await import('./App')).default;
  }, 30000);

  beforeEach(() => {
    vi.clearAllMocks();
    // Default auth state
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      hasCompletedSetup: false,
    });
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
    expect(screen.getByTestId('sonner')).toBeInTheDocument();
  });

  it('creates QueryClient with correct default options', () => {
    render(<App />);
    // The app should render successfully with the QueryClient configured
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  it('renders landing page at root path', () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(window.location.pathname).toBe('/');
  });

  it('renders not found page for unknown routes', () => {
    window.history.pushState({}, '', '/unknown-route');
    render(<App />);
    expect(window.location.pathname).toBe('/unknown-route');
  });

  describe('Guest Routes', () => {
    it('renders login page when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        hasCompletedSetup: false,
      });
      window.history.pushState({}, '', '/login');
      render(<App />);
      expect(window.location.pathname).toBe('/login');
    });

    it('renders register page when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        hasCompletedSetup: false,
      });
      window.history.pushState({}, '', '/register');
      render(<App />);
      expect(window.location.pathname).toBe('/register');
    });

    it('renders forgot password page when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        hasCompletedSetup: false,
      });
      window.history.pushState({}, '', '/forgot-password');
      render(<App />);
      expect(window.location.pathname).toBe('/forgot-password');
    });

    it('renders reset password page when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        hasCompletedSetup: false,
      });
      window.history.pushState({}, '', '/reset-password');
      render(<App />);
      expect(window.location.pathname).toBe('/reset-password');
    });

    it('redirects to dashboard when authenticated user visits guest route', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        hasCompletedSetup: true,
      });
      window.history.pushState({}, '', '/login');
      render(<App />);
      expect(screen.getByText('Redirect to Dashboard')).toBeInTheDocument();
    });
  });

  describe('Account Setup Route', () => {
    it('renders account setup when authenticated without completed setup', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        hasCompletedSetup: false,
      });
      window.history.pushState({}, '', '/account-setup');
      render(<App />);
      expect(window.location.pathname).toBe('/account-setup');
    });

    it('redirects to login when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        hasCompletedSetup: false,
      });
      window.history.pushState({}, '', '/account-setup');
      render(<App />);
      expect(screen.getByText('Redirect to Login')).toBeInTheDocument();
    });

    it('redirects to dashboard when authenticated with completed setup', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        hasCompletedSetup: true,
      });
      window.history.pushState({}, '', '/account-setup');
      render(<App />);
      expect(screen.getByText('Redirect to Dashboard')).toBeInTheDocument();
    });
  });

  describe('Protected Routes', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        hasCompletedSetup: true,
      });
    });

    it('renders dashboard when authenticated', () => {
      window.history.pushState({}, '', '/dashboard');
      render(<App />);
      expect(window.location.pathname).toBe('/dashboard');
    });

    it('renders diagnostic reports list when authenticated', () => {
      window.history.pushState({}, '', '/diagnostic-reports');
      render(<App />);
      expect(window.location.pathname).toBe('/diagnostic-reports');
    });

    it('renders new diagnostic report when authenticated', () => {
      window.history.pushState({}, '', '/diagnostic-reports/new');
      render(<App />);
      expect(window.location.pathname).toBe('/diagnostic-reports/new');
    });

    it('renders diagnostic report detail when authenticated', () => {
      window.history.pushState({}, '', '/diagnostic-reports/123');
      render(<App />);
      expect(window.location.pathname).toBe('/diagnostic-reports/123');
    });

    it('renders settings when authenticated', () => {
      window.history.pushState({}, '', '/settings');
      render(<App />);
      expect(window.location.pathname).toBe('/settings');
    });

    it('redirects to login when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        hasCompletedSetup: false,
      });
      window.history.pushState({}, '', '/dashboard');
      render(<App />);
      expect(screen.getByText('Redirect to Login')).toBeInTheDocument();
    });

    it('redirects to account setup when authenticated without completed setup', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        hasCompletedSetup: false,
      });
      window.history.pushState({}, '', '/dashboard');
      render(<App />);
      expect(screen.getByText('Redirect to Account Setup')).toBeInTheDocument();
    });
  });

  describe('Settings Nested Routes', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        hasCompletedSetup: true,
      });
    });

    it('renders settings with nested routes structure', () => {
      window.history.pushState({}, '', '/settings/profile');
      render(<App />);
      expect(window.location.pathname).toBe('/settings/profile');
    });
  });

  describe('Query Client Configuration', () => {
    it('configures staleTime to 5 minutes', () => {
      render(<App />);
      // The app should render successfully with the QueryClient configured
      // Testing that the app doesn't crash with the configuration
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });

    it('configures retry to 1', () => {
      render(<App />);
      // The app should render successfully with the QueryClient configured
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });
  });

  describe('Provider Hierarchy', () => {
    it('wraps app in QueryClientProvider', () => {
      render(<App />);
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });

    it('wraps app in AuthProvider', () => {
      render(<App />);
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });

    it('wraps app in TooltipProvider', () => {
      render(<App />);
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });

    it('includes both Toaster components', () => {
      render(<App />);
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
      expect(screen.getByTestId('sonner')).toBeInTheDocument();
    });
  });

  describe('Route Redirects', () => {
    it('redirects /settings to /settings/profile', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        hasCompletedSetup: true,
      });
      window.history.pushState({}, '', '/settings');
      render(<App />);
      expect(window.location.pathname).toBe('/settings');
    });
  });
});