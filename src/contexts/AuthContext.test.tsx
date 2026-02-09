import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';

const mockGetAccount = vi.fn();
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockLogout = vi.fn();

vi.mock('@/api', () => ({
  accountService: {
    getAccount: (...args: unknown[]) => mockGetAccount(...args),
  },
  authService: {
    login: (...args: unknown[]) => mockLogin(...args),
    register: (...args: unknown[]) => mockRegister(...args),
    logout: (...args: unknown[]) => mockLogout(...args),
  },
  ApiClientError: class ApiClientError extends Error {
    status: number;
    constructor({ status, message }: { status: number; message: string }) {
      super(message);
      this.status = status;
    }
    isAuthError() {
      return this.status === 401;
    }
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initAuth', () => {
    it('sets authenticated state when getAccount succeeds', async () => {
      const account = { id: '1', nickname: 'John', date_of_birth: '1990-01-01', sex: 'male', language: 'en', timezone: 'UTC' };
      mockGetAccount.mockResolvedValue(account);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.hasCompletedSetup).toBe(true);
      expect(result.current.account).toEqual(account);
    });

    it('sets unauthenticated state when getAccount returns 401', async () => {
      const { ApiClientError } = await import('@/api');
      mockGetAccount.mockRejectedValue(new ApiClientError({ status: 401, message: 'Unauthenticated' }));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.hasCompletedSetup).toBe(false);
      expect(result.current.account).toBeNull();
    });

    it('sets authenticated without setup when getAccount returns 404', async () => {
      const { ApiClientError } = await import('@/api');
      mockGetAccount.mockRejectedValue(new ApiClientError({ status: 404, message: 'Not found' }));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.hasCompletedSetup).toBe(false);
      expect(result.current.account).toBeNull();
    });
  });

  describe('login', () => {
    it('sets user and account after successful login', async () => {
      mockGetAccount.mockRejectedValueOnce(new (await import('@/api')).ApiClientError({ status: 401, message: '' }));
      mockLogin.mockResolvedValue({ user: 'user-1' });
      const account = { id: '1', nickname: null, date_of_birth: '1990-01-01', sex: 'male', language: 'en', timezone: 'UTC' };
      mockGetAccount.mockResolvedValue(account);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.login('user@example.com', 'password123');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.hasCompletedSetup).toBe(true);
      expect(result.current.account).toEqual(account);
    });

    it('sets hasCompletedSetup to false when account does not exist after login', async () => {
      mockGetAccount.mockRejectedValueOnce(new (await import('@/api')).ApiClientError({ status: 401, message: '' }));
      mockLogin.mockResolvedValue({ user: 'user-1' });
      mockGetAccount.mockRejectedValue(new (await import('@/api')).ApiClientError({ status: 404, message: 'Not found' }));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.login('user@example.com', 'password123');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.hasCompletedSetup).toBe(false);
    });
  });

  describe('logout', () => {
    it('clears auth state after logout', async () => {
      const account = { id: '1', nickname: null, date_of_birth: '1990-01-01', sex: 'male', language: 'en', timezone: 'UTC' };
      mockGetAccount.mockResolvedValue(account);
      mockLogout.mockResolvedValue({ status: 'logged_out' });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.account).toBeNull();
      expect(result.current.user).toBeNull();
    });

    it('clears state even if server logout fails', async () => {
      const account = { id: '1', nickname: null, date_of_birth: '1990-01-01', sex: 'male', language: 'en', timezone: 'UTC' };
      mockGetAccount.mockResolvedValue(account);
      mockLogout.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
