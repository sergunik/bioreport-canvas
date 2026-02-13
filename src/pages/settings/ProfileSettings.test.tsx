import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileSettingsPage from './ProfileSettings';
import type { Profile } from '@/types/api';

const mockToast = vi.fn();
const mockGetProfile = vi.fn();
const mockUpdateProfile = vi.fn();

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
    updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
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

vi.mock('@/types', () => ({
  LANGUAGE_OPTIONS: [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
  ],
  TIMEZONE_OPTIONS: [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
  ],
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

const mockProfile: Profile = {
  id: '1',
  email: 'user@example.com',
  nickname: 'TestUser',
  date_of_birth: '1990-01-01',
  sex: 'male',
  language: 'en',
  timezone: 'UTC',
};

describe('ProfileSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while fetching profile', () => {
    mockGetProfile.mockImplementation(() => new Promise(() => {}));
    render(<ProfileSettingsPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('loads and displays profile data', async () => {
    mockGetProfile.mockResolvedValue(mockProfile);
    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('TestUser')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('user@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1990-01-01')).toBeInTheDocument();
  });

  it('displays sex as translated label', async () => {
    mockGetProfile.mockResolvedValue(mockProfile);
    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('accountSetup.sex.male')).toBeInTheDocument();
    });
  });

  it('displays female sex correctly', async () => {
    mockGetProfile.mockResolvedValue({ ...mockProfile, sex: 'female' });
    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('accountSetup.sex.female')).toBeInTheDocument();
    });
  });

  it('disables email, sex, and date of birth fields', async () => {
    mockGetProfile.mockResolvedValue(mockProfile);
    render(<ProfileSettingsPage />);

    await waitFor(() => {
      const emailInput = screen.getByDisplayValue('user@example.com');
      expect(emailInput).toBeDisabled();
    });

    const dobInput = screen.getByDisplayValue('1990-01-01');
    expect(dobInput).toBeDisabled();
  });

  it('enables editing of nickname, language, and timezone', async () => {
    mockGetProfile.mockResolvedValue(mockProfile);
    render(<ProfileSettingsPage />);

    await waitFor(() => {
      const nicknameInput = screen.getByDisplayValue('TestUser');
      expect(nicknameInput).not.toBeDisabled();
    });
  });

  it('updates profile successfully', async () => {
    mockGetProfile.mockResolvedValue(mockProfile);
    const updatedProfile = { ...mockProfile, nickname: 'NewNickname' };
    mockUpdateProfile.mockResolvedValue({ status: 'updated' });
    mockGetProfile.mockResolvedValueOnce(mockProfile).mockResolvedValueOnce(updatedProfile);

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('TestUser')).toBeInTheDocument();
    });

    const nicknameInput = screen.getByDisplayValue('TestUser');
    fireEvent.change(nicknameInput, { target: { value: 'NewNickname' } });

    const saveButton = screen.getByRole('button', { name: /common.save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        nickname: 'NewNickname',
        language: 'en',
        timezone: 'UTC',
      });
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'common.success',
      description: 'settings.profile.saved',
    });
  });

  it('handles validation errors from API', async () => {
    mockGetProfile.mockResolvedValue(mockProfile);
    const { ApiClientError } = await import('@/api');
    mockUpdateProfile.mockRejectedValue(
      new ApiClientError('Validation failed', { nickname: ['Nickname is too long'] })
    );

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('TestUser')).toBeInTheDocument();
    });

    const nicknameInput = screen.getByDisplayValue('TestUser');
    fireEvent.change(nicknameInput, { target: { value: 'A'.repeat(300) } });

    const saveButton = screen.getByRole('button', { name: /common.save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Nickname is too long')).toBeInTheDocument();
    });
  });

  it('handles API errors with toast', async () => {
    mockGetProfile.mockResolvedValue(mockProfile);
    const { ApiClientError } = await import('@/api');
    mockUpdateProfile.mockRejectedValue(new ApiClientError('Server error'));

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('TestUser')).toBeInTheDocument();
    });

    const nicknameInput = screen.getByDisplayValue('TestUser');
    fireEvent.change(nicknameInput, { target: { value: 'NewNickname' } });

    const saveButton = screen.getByRole('button', { name: /common.save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'common.error',
        description: 'Server error',
      });
    });
  });

  it('handles unknown errors', async () => {
    mockGetProfile.mockResolvedValue(mockProfile);
    mockUpdateProfile.mockRejectedValue(new Error('Unknown error'));

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('TestUser')).toBeInTheDocument();
    });

    const nicknameInput = screen.getByDisplayValue('TestUser');
    fireEvent.change(nicknameInput, { target: { value: 'NewNickname' } });

    const saveButton = screen.getByRole('button', { name: /common.save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'common.error',
        description: 'An unexpected error occurred',
      });
    });
  });

  it('disables save button when form is pristine', async () => {
    mockGetProfile.mockResolvedValue(mockProfile);
    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('TestUser')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /common.save/i });
    expect(saveButton).toBeDisabled();
  });

  it('enables save button when form is dirty', async () => {
    mockGetProfile.mockResolvedValue(mockProfile);
    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('TestUser')).toBeInTheDocument();
    });

    const nicknameInput = screen.getByDisplayValue('TestUser');
    fireEvent.change(nicknameInput, { target: { value: 'NewNickname' } });

    const saveButton = screen.getByRole('button', { name: /common.save/i });
    expect(saveButton).not.toBeDisabled();
  });

  it('shows loading state on save button when submitting', async () => {
    mockGetProfile.mockResolvedValue(mockProfile);
    mockUpdateProfile.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('TestUser')).toBeInTheDocument();
    });

    const nicknameInput = screen.getByDisplayValue('TestUser');
    fireEvent.change(nicknameInput, { target: { value: 'NewNickname' } });

    const saveButton = screen.getByRole('button', { name: /common.save/i });
    fireEvent.click(saveButton);

    expect(saveButton).toBeDisabled();
  });

  it('handles profile fetch error on mount', async () => {
    const { ApiClientError } = await import('@/api');
    mockGetProfile.mockRejectedValue(new ApiClientError('Failed to load profile'));

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'common.error',
        description: 'Failed to load profile',
      });
    });
  });

  it('handles empty nickname correctly', async () => {
    mockGetProfile.mockResolvedValue({ ...mockProfile, nickname: null });
    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });
  });

  it('sends null for empty nickname on update', async () => {
    mockGetProfile.mockResolvedValue(mockProfile);
    mockUpdateProfile.mockResolvedValue({ status: 'updated' });
    mockGetProfile.mockResolvedValueOnce(mockProfile).mockResolvedValueOnce({ ...mockProfile, nickname: null });

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('TestUser')).toBeInTheDocument();
    });

    const nicknameInput = screen.getByDisplayValue('TestUser');
    fireEvent.change(nicknameInput, { target: { value: '' } });

    const saveButton = screen.getByRole('button', { name: /common.save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        nickname: null,
        language: 'en',
        timezone: 'UTC',
      });
    });
  });
});