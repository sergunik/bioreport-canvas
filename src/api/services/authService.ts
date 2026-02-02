import api, { tokenManager } from '../client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  LogoutResponse,
  RefreshResponse,
} from '@/types/api';

export const authService = {
  /**
   * Login with email and password
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data, { skipAuth: true });
    // In a real implementation, tokens would be set from response
    // tokenManager.setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/auth/register', data, { skipAuth: true });
    return response;
  },

  /**
   * Request password reset email
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    return api.post<ForgotPasswordResponse>('/auth/password/forgot', data, { skipAuth: true });
  },

  /**
   * Reset password with token
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    return api.post<ResetPasswordResponse>('/auth/password/reset', data, { skipAuth: true });
  },

  /**
   * Refresh the access token
   */
  refresh: async (): Promise<RefreshResponse> => {
    return api.post<RefreshResponse>('/auth/refresh');
  },

  /**
   * Logout the current user
   */
  logout: async (): Promise<LogoutResponse> => {
    const response = await api.post<LogoutResponse>('/auth/logout');
    tokenManager.clearTokens();
    return response;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return tokenManager.hasTokens();
  },
};

export default authService;
