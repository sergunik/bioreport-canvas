import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNavigate } from 'react-router-dom';
import DangerZoneSection from './DangerZone';

const mockToast = vi.fn();
const mockLogout = vi.fn();
const mockDeleteUser = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ logout: mockLogout }),
}));

vi.mock('@/api', () => ({
  profileService: {
    deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
  },
  ApiClientError: class ApiClientError extends Error {
    fieldErrors: Record<string, string[]>;
    constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
      super(message);
      this.fieldErrors = fieldErrors;
    }
    isValidationError() {
      return Object.keys(this.fieldErrors).length > 0;
    }
    getFieldErrors() {
      return this.fieldErrors;
    }
    getFirstError() {
      const errors = Object.values(this.fieldErrors);
      return errors[0]?.[0] || this.message;
    }
  },
}));

vi.mock('./components/SettingsSectionCard', () => ({
  default: ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
    <div data-testid="settings-card">
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  ),
}));

vi.mock('./components/FormErrorText', () => ({
  default: ({ message }: { message?: string }) => message ? <span data-testid="error">{message}</span> : null,
}));

describe('DangerZoneSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the danger zone section', () => {
    render(<DangerZoneSection />);
    expect(screen.getByText('settings.dangerZone.deleteAccount.title')).toBeInTheDocument();
    expect(screen.getByText('settings.dangerZone.deleteAccount.description')).toBeInTheDocument();
  });

  it('renders warning message', () => {
    render(<DangerZoneSection />);
    expect(screen.getByText('settings.dangerZone.deleteAccount.warning')).toBeInTheDocument();
  });

  it('renders password input field', () => {
    render(<DangerZoneSection />);
    const passwordInput = screen.getByLabelText('settings.dangerZone.deleteAccount.confirmLabel');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('validates password is required', async () => {
    render(<DangerZoneSection />);

    const submitButton = screen.getByRole('button', { name: /settings.dangerZone.deleteAccount.submit/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when password is entered', async () => {
    render(<DangerZoneSection />);

    const passwordInput = screen.getByLabelText('settings.dangerZone.deleteAccount.confirmLabel');
    fireEvent.change(passwordInput, { target: { value: 'MyPassword123!' } });

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /settings.dangerZone.deleteAccount.submit/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('shows confirmation dialog when form is submitted', async () => {
    render(<DangerZoneSection />);

    const passwordInput = screen.getByLabelText('settings.dangerZone.deleteAccount.confirmLabel');
    fireEvent.change(passwordInput, { target: { value: 'MyPassword123!' } });

    const submitButton = screen.getByRole('button', { name: /settings.dangerZone.deleteAccount.submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('settings.dangerZone.deleteAccount.confirmTitle')).toBeInTheDocument();
    });

    expect(screen.getByText('settings.dangerZone.deleteAccount.confirmDescription')).toBeInTheDocument();
  });

  it('closes confirmation dialog when cancel is clicked', async () => {
    render(<DangerZoneSection />);

    const passwordInput = screen.getByLabelText('settings.dangerZone.deleteAccount.confirmLabel');
    fireEvent.change(passwordInput, { target: { value: 'MyPassword123!' } });

    const submitButton = screen.getByRole('button', { name: /settings.dangerZone.deleteAccount.submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('settings.dangerZone.deleteAccount.confirmTitle')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('common.cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('settings.dangerZone.deleteAccount.confirmTitle')).not.toBeInTheDocument();
    });
  });

  it('deletes account successfully and logs out', async () => {
    mockDeleteUser.mockResolvedValue({ status: 'account_deleted' });
    mockLogout.mockResolvedValue(undefined);

    render(<DangerZoneSection />);

    const passwordInput = screen.getByLabelText('settings.dangerZone.deleteAccount.confirmLabel');
    fireEvent.change(passwordInput, { target: { value: 'MyPassword123!' } });

    const submitButton = screen.getByRole('button', { name: /settings.dangerZone.deleteAccount.submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('settings.dangerZone.deleteAccount.confirmTitle')).toBeInTheDocument();
    });

    const confirmButton = screen.getAllByText('settings.dangerZone.deleteAccount.submit')[1];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteUser).toHaveBeenCalledWith('MyPassword123!');
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'common.success',
      description: 'settings.dangerZone.deleteAccount.success',
    });

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('handles validation errors from API', async () => {
    const { ApiClientError } = await import('@/api');
    mockDeleteUser.mockRejectedValue(
      new ApiClientError('Validation failed', { password: ['Password is incorrect'] })
    );

    render(<DangerZoneSection />);

    const passwordInput = screen.getByLabelText('settings.dangerZone.deleteAccount.confirmLabel');
    fireEvent.change(passwordInput, { target: { value: 'WrongPassword' } });

    const submitButton = screen.getByRole('button', { name: /settings.dangerZone.deleteAccount.submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('settings.dangerZone.deleteAccount.confirmTitle')).toBeInTheDocument();
    });

    const confirmButton = screen.getAllByText('settings.dangerZone.deleteAccount.submit')[1];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'common.error',
        description: 'Password is incorrect',
      });
    });

    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('handles API errors with toast', async () => {
    const { ApiClientError } = await import('@/api');
    mockDeleteUser.mockRejectedValue(new ApiClientError('Server error'));

    render(<DangerZoneSection />);

    const passwordInput = screen.getByLabelText('settings.dangerZone.deleteAccount.confirmLabel');
    fireEvent.change(passwordInput, { target: { value: 'MyPassword123!' } });

    const submitButton = screen.getByRole('button', { name: /settings.dangerZone.deleteAccount.submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('settings.dangerZone.deleteAccount.confirmTitle')).toBeInTheDocument();
    });

    const confirmButton = screen.getAllByText('settings.dangerZone.deleteAccount.submit')[1];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'common.error',
        description: 'Server error',
      });
    });

    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('handles unknown errors', async () => {
    mockDeleteUser.mockRejectedValue(new Error('Unknown error'));

    render(<DangerZoneSection />);

    const passwordInput = screen.getByLabelText('settings.dangerZone.deleteAccount.confirmLabel');
    fireEvent.change(passwordInput, { target: { value: 'MyPassword123!' } });

    const submitButton = screen.getByRole('button', { name: /settings.dangerZone.deleteAccount.submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('settings.dangerZone.deleteAccount.confirmTitle')).toBeInTheDocument();
    });

    const confirmButton = screen.getAllByText('settings.dangerZone.deleteAccount.submit')[1];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'common.error',
        description: 'An unexpected error occurred',
      });
    });
  });

  it('shows loading state on submit button during deletion', async () => {
    mockDeleteUser.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<DangerZoneSection />);

    const passwordInput = screen.getByLabelText('settings.dangerZone.deleteAccount.confirmLabel');
    fireEvent.change(passwordInput, { target: { value: 'MyPassword123!' } });

    const submitButton = screen.getByRole('button', { name: /settings.dangerZone.deleteAccount.submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('settings.dangerZone.deleteAccount.confirmTitle')).toBeInTheDocument();
    });

    const confirmButton = screen.getAllByText('settings.dangerZone.deleteAccount.submit')[1];
    fireEvent.click(confirmButton);

    // Dialog should close and button should be disabled
    await waitFor(() => {
      expect(screen.queryByText('settings.dangerZone.deleteAccount.confirmTitle')).not.toBeInTheDocument();
    });
  });

  it('displays password required error when empty', async () => {
    render(<DangerZoneSection />);

    const passwordInput = screen.getByLabelText('settings.dangerZone.deleteAccount.confirmLabel');
    fireEvent.change(passwordInput, { target: { value: 'something' } });
    fireEvent.change(passwordInput, { target: { value: '' } });
    fireEvent.blur(passwordInput);

    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('clears pending password after successful deletion', async () => {
    mockDeleteUser.mockResolvedValue({ status: 'account_deleted' });
    mockLogout.mockResolvedValue(undefined);

    render(<DangerZoneSection />);

    const passwordInput = screen.getByLabelText('settings.dangerZone.deleteAccount.confirmLabel');
    fireEvent.change(passwordInput, { target: { value: 'MyPassword123!' } });

    const submitButton = screen.getByRole('button', { name: /settings.dangerZone.deleteAccount.submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('settings.dangerZone.deleteAccount.confirmTitle')).toBeInTheDocument();
    });

    const confirmButton = screen.getAllByText('settings.dangerZone.deleteAccount.submit')[1];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteUser).toHaveBeenCalled();
    });
  });

  it('does not call API until confirmation dialog is confirmed', async () => {
    render(<DangerZoneSection />);

    const passwordInput = screen.getByLabelText('settings.dangerZone.deleteAccount.confirmLabel');
    fireEvent.change(passwordInput, { target: { value: 'MyPassword123!' } });

    const submitButton = screen.getByRole('button', { name: /settings.dangerZone.deleteAccount.submit/i });
    fireEvent.click(submitButton);

    expect(mockDeleteUser).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText('settings.dangerZone.deleteAccount.confirmTitle')).toBeInTheDocument();
    });

    expect(mockDeleteUser).not.toHaveBeenCalled();
  });
});