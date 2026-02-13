import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SecuritySettingsPage from './SecuritySettings';
import type { Profile } from '@/types/api';

const mockToast = vi.fn();
const mockGetProfile = vi.fn();
const mockUpdateSecurity = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/api', () => ({
  profileService: {
    getProfile: (...args: unknown[]) => mockGetProfile(...args),
  },
  securityService: {
    updateSecurity: (...args: unknown[]) => mockUpdateSecurity(...args),
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

vi.mock('@/components/auth', () => ({
  PasswordStrengthIndicator: ({ password }: { password: string }) => (
    <div data-testid="password-strength">{password}</div>
  ),
}));

const mockProfile: Profile = {
  id: '1',
  email: 'user@example.com',
  nickname: 'TestUser',
  date_of_birth: '1990-01-01',
  sex: 'male',
  language: 'en',
  timezone: 'UTC',
};

describe('SecuritySettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders both change email and change password sections', () => {
    mockGetProfile.mockResolvedValue(mockProfile);
    render(<SecuritySettingsPage />);

    expect(screen.getByText('settings.security.changeEmail.title')).toBeInTheDocument();
    expect(screen.getByText('settings.security.changePassword.title')).toBeInTheDocument();
  });

  describe('ChangeEmailCard', () => {
    it('loads current email from profile', async () => {
      mockGetProfile.mockResolvedValue(mockProfile);
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('user@example.com')).toBeInTheDocument();
      });
    });

    it('updates email successfully', async () => {
      mockGetProfile.mockResolvedValue(mockProfile);
      const updatedProfile = { ...mockProfile, email: 'newemail@example.com' };
      mockUpdateSecurity.mockResolvedValue({ status: 'updated' });
      mockGetProfile.mockResolvedValueOnce(mockProfile).mockResolvedValueOnce(updatedProfile);

      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('user@example.com')).toBeInTheDocument();
      });

      const emailInput = screen.getByDisplayValue('user@example.com');
      fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });

      const submitButtons = screen.getAllByRole('button', { name: /settings.security.changeEmail.submit/i });
      fireEvent.click(submitButtons[0]);

      await waitFor(() => {
        expect(mockUpdateSecurity).toHaveBeenCalledWith({ email: 'newemail@example.com' });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'common.success',
        description: 'settings.security.changeEmail.success',
      });
    });

    it('validates email format', async () => {
      mockGetProfile.mockResolvedValue(mockProfile);
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('user@example.com')).toBeInTheDocument();
      });

      const emailInput = screen.getByDisplayValue('user@example.com');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
      });
    });

    it('handles email validation errors from API', async () => {
      mockGetProfile.mockResolvedValue(mockProfile);
      const { ApiClientError } = await import('@/api');
      mockUpdateSecurity.mockRejectedValue(
        new ApiClientError('Validation failed', { email: ['Email already in use'] })
      );

      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('user@example.com')).toBeInTheDocument();
      });

      const emailInput = screen.getByDisplayValue('user@example.com');
      fireEvent.change(emailInput, { target: { value: 'taken@example.com' } });

      const submitButtons = screen.getAllByRole('button', { name: /settings.security.changeEmail.submit/i });
      fireEvent.click(submitButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Email already in use')).toBeInTheDocument();
      });
    });

    it('handles API errors with toast for email change', async () => {
      mockGetProfile.mockResolvedValue(mockProfile);
      const { ApiClientError } = await import('@/api');
      mockUpdateSecurity.mockRejectedValue(new ApiClientError('Server error'));

      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('user@example.com')).toBeInTheDocument();
      });

      const emailInput = screen.getByDisplayValue('user@example.com');
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

      const submitButtons = screen.getAllByRole('button', { name: /settings.security.changeEmail.submit/i });
      fireEvent.click(submitButtons[0]);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'common.error',
          description: 'Server error',
        });
      });
    });

    it('handles unknown errors for email change', async () => {
      mockGetProfile.mockResolvedValue(mockProfile);
      mockUpdateSecurity.mockRejectedValue(new Error('Unknown error'));

      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('user@example.com')).toBeInTheDocument();
      });

      const emailInput = screen.getByDisplayValue('user@example.com');
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

      const submitButtons = screen.getAllByRole('button', { name: /settings.security.changeEmail.submit/i });
      fireEvent.click(submitButtons[0]);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'common.error',
          description: 'An unexpected error occurred',
        });
      });
    });

    it('handles profile fetch failure gracefully', async () => {
      mockGetProfile.mockRejectedValue(new Error('Failed to load'));
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('new@example.com');
        expect(emailInput).toHaveValue('');
      });
    });
  });

  describe('ChangePasswordCard', () => {
    beforeEach(() => {
      mockGetProfile.mockResolvedValue(mockProfile);
    });

    it('renders all password fields', async () => {
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('settings.security.changePassword.currentPassword')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('settings.security.changePassword.newPassword')).toBeInTheDocument();
      expect(screen.getByLabelText('settings.security.changePassword.confirmPassword')).toBeInTheDocument();
    });

    it('updates password successfully', async () => {
      mockUpdateSecurity.mockResolvedValue({ status: 'updated' });
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('settings.security.changePassword.currentPassword')).toBeInTheDocument();
      });

      const currentPasswordInput = screen.getByLabelText('settings.security.changePassword.currentPassword');
      const newPasswordInput = screen.getByLabelText('settings.security.changePassword.newPassword');
      const confirmPasswordInput = screen.getByLabelText('settings.security.changePassword.confirmPassword');

      fireEvent.change(currentPasswordInput, { target: { value: 'CurrentPassword123!' } });
      fireEvent.change(newPasswordInput, { target: { value: 'NewPassword123!!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!!' } });

      const submitButtons = screen.getAllByRole('button', { name: /settings.security.changePassword.submit/i });
      fireEvent.click(submitButtons[0]);

      await waitFor(() => {
        expect(mockUpdateSecurity).toHaveBeenCalledWith({
          current_password: 'CurrentPassword123!',
          password: 'NewPassword123!!',
          password_confirmation: 'NewPassword123!!',
        });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'common.success',
        description: 'settings.security.changePassword.success',
      });
    });

    it('validates password minimum length', async () => {
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('settings.security.changePassword.newPassword')).toBeInTheDocument();
      });

      const newPasswordInput = screen.getByLabelText('settings.security.changePassword.newPassword');
      fireEvent.change(newPasswordInput, { target: { value: 'short' } });
      fireEvent.blur(newPasswordInput);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 12 characters')).toBeInTheDocument();
      });
    });

    it('validates password confirmation match', async () => {
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('settings.security.changePassword.newPassword')).toBeInTheDocument();
      });

      const newPasswordInput = screen.getByLabelText('settings.security.changePassword.newPassword');
      const confirmPasswordInput = screen.getByLabelText('settings.security.changePassword.confirmPassword');

      fireEvent.change(newPasswordInput, { target: { value: 'NewPassword123!!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123!!' } });
      fireEvent.blur(confirmPasswordInput);

      await waitFor(() => {
        expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
      });
    });

    it('validates current password is required', async () => {
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('settings.security.changePassword.currentPassword')).toBeInTheDocument();
      });

      const currentPasswordInput = screen.getByLabelText('settings.security.changePassword.currentPassword');
      fireEvent.blur(currentPasswordInput);

      await waitFor(() => {
        expect(screen.getByText('Current password is required')).toBeInTheDocument();
      });
    });

    it('shows password strength indicator', async () => {
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('settings.security.changePassword.newPassword')).toBeInTheDocument();
      });

      const newPasswordInput = screen.getByLabelText('settings.security.changePassword.newPassword');
      fireEvent.change(newPasswordInput, { target: { value: 'StrongPassword123!' } });

      expect(screen.getByTestId('password-strength')).toHaveTextContent('StrongPassword123!');
    });

    it('handles password validation errors from API', async () => {
      const { ApiClientError } = await import('@/api');
      mockUpdateSecurity.mockRejectedValue(
        new ApiClientError('Validation failed', { current_password: ['Current password is incorrect'] })
      );

      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('settings.security.changePassword.currentPassword')).toBeInTheDocument();
      });

      const currentPasswordInput = screen.getByLabelText('settings.security.changePassword.currentPassword');
      const newPasswordInput = screen.getByLabelText('settings.security.changePassword.newPassword');
      const confirmPasswordInput = screen.getByLabelText('settings.security.changePassword.confirmPassword');

      fireEvent.change(currentPasswordInput, { target: { value: 'WrongPassword123!' } });
      fireEvent.change(newPasswordInput, { target: { value: 'NewPassword123!!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!!' } });

      const submitButtons = screen.getAllByRole('button', { name: /settings.security.changePassword.submit/i });
      fireEvent.click(submitButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
      });
    });

    it('handles API errors with toast for password change', async () => {
      const { ApiClientError } = await import('@/api');
      mockUpdateSecurity.mockRejectedValue(new ApiClientError('Server error'));

      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('settings.security.changePassword.currentPassword')).toBeInTheDocument();
      });

      const currentPasswordInput = screen.getByLabelText('settings.security.changePassword.currentPassword');
      const newPasswordInput = screen.getByLabelText('settings.security.changePassword.newPassword');
      const confirmPasswordInput = screen.getByLabelText('settings.security.changePassword.confirmPassword');

      fireEvent.change(currentPasswordInput, { target: { value: 'CurrentPassword123!' } });
      fireEvent.change(newPasswordInput, { target: { value: 'NewPassword123!!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!!' } });

      const submitButtons = screen.getAllByRole('button', { name: /settings.security.changePassword.submit/i });
      fireEvent.click(submitButtons[0]);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'common.error',
          description: 'Server error',
        });
      });
    });

    it('handles unknown errors for password change', async () => {
      mockUpdateSecurity.mockRejectedValue(new Error('Unknown error'));

      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('settings.security.changePassword.currentPassword')).toBeInTheDocument();
      });

      const currentPasswordInput = screen.getByLabelText('settings.security.changePassword.currentPassword');
      const newPasswordInput = screen.getByLabelText('settings.security.changePassword.newPassword');
      const confirmPasswordInput = screen.getByLabelText('settings.security.changePassword.confirmPassword');

      fireEvent.change(currentPasswordInput, { target: { value: 'CurrentPassword123!' } });
      fireEvent.change(newPasswordInput, { target: { value: 'NewPassword123!!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!!' } });

      const submitButtons = screen.getAllByRole('button', { name: /settings.security.changePassword.submit/i });
      fireEvent.click(submitButtons[0]);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'common.error',
          description: 'An unexpected error occurred',
        });
      });
    });

    it('clears password fields after successful update', async () => {
      mockUpdateSecurity.mockResolvedValue({ status: 'updated' });
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('settings.security.changePassword.currentPassword')).toBeInTheDocument();
      });

      const currentPasswordInput = screen.getByLabelText('settings.security.changePassword.currentPassword') as HTMLInputElement;
      const newPasswordInput = screen.getByLabelText('settings.security.changePassword.newPassword') as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText('settings.security.changePassword.confirmPassword') as HTMLInputElement;

      fireEvent.change(currentPasswordInput, { target: { value: 'CurrentPassword123!' } });
      fireEvent.change(newPasswordInput, { target: { value: 'NewPassword123!!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!!' } });

      const submitButtons = screen.getAllByRole('button', { name: /settings.security.changePassword.submit/i });
      fireEvent.click(submitButtons[0]);

      await waitFor(() => {
        expect(currentPasswordInput.value).toBe('');
        expect(newPasswordInput.value).toBe('');
        expect(confirmPasswordInput.value).toBe('');
      });
    });
  });
});