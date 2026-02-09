import api from '../client';
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
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return api.post<LoginResponse>('/auth/login', data);
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    return api.post<RegisterResponse>('/auth/register', data);
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    return api.post<ForgotPasswordResponse>('/auth/password/forgot', data);
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    return api.post<ResetPasswordResponse>('/auth/password/reset', data);
  },

  refresh: async (): Promise<RefreshResponse> => {
    return api.post<RefreshResponse>('/auth/refresh');
  },

  logout: async (): Promise<LogoutResponse> => {
    return api.post<LogoutResponse>('/auth/logout');
  },
};

export default authService;
