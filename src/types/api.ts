// API Types based on OpenAPI specification

// ==================== Auth Types ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  status: 'ok';
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  user: string;
}

export interface RefreshResponse {
  status: 'ok';
}

export interface LogoutResponse {
  status: 'logged_out';
}

// ==================== Account Types ====================

export type Sex = 'male' | 'female';

export interface Account {
  id: string;
  nickname: string | null;
  date_of_birth: string;
  sex: Sex;
  language: string;
  timezone: string;
}

export interface CreateAccountRequest {
  sex: Sex;
  date_of_birth: string;
  nickname?: string | null;
  language?: string;
  timezone?: string;
}

export interface UpdateAccountRequest {
  nickname?: string | null;
  language?: string;
  timezone?: string;
  sex?: string;
  date_of_birth?: string;
}

export interface UpdateAccountResponse {
  status: 'updated';
}

export interface DeleteAccountResponse {
  status: 'account_deleted';
}

export interface AccountExistsResponse {
  status: 'account_exists';
}

// ==================== Health Check Types ====================

export interface HealthCheckResponse {
  service: string;
  environment: string;
  version: string;
  timestamp: string;
}

// ==================== Error Types ====================

export interface ValidationError {
  message: string;
  errors: Record<string, string[]>;
}

export interface AuthenticationError {
  message: string;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

// ==================== User State ====================

export interface User {
  id: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  account: Account | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedSetup: boolean;
}
