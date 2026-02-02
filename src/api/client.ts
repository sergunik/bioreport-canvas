import { ApiError, ValidationError } from '@/types/api';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Token storage keys
const ACCESS_TOKEN_KEY = 'bioreport_access_token';
const REFRESH_TOKEN_KEY = 'bioreport_refresh_token';

// Token management
export const tokenManager = {
  getAccessToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken?: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },
  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  hasTokens: (): boolean => !!localStorage.getItem(ACCESS_TOKEN_KEY),
};

// Custom error class for API errors
export class ApiClientError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiClientError';
    this.status = error.status;
    this.errors = error.errors;
  }

  isValidationError(): boolean {
    return this.status === 422;
  }

  isAuthError(): boolean {
    return this.status === 401;
  }

  getFieldErrors(): Record<string, string[]> {
    return this.errors || {};
  }

  getFirstError(): string {
    if (this.errors) {
      const firstField = Object.keys(this.errors)[0];
      if (firstField && this.errors[firstField].length > 0) {
        return this.errors[firstField][0];
      }
    }
    return this.message;
  }
}

// Parse error response
async function parseErrorResponse(response: Response): Promise<ApiError> {
  try {
    const data = await response.json();
    
    if (response.status === 422) {
      const validationError = data as ValidationError;
      return {
        status: response.status,
        message: validationError.message,
        errors: validationError.errors,
      };
    }
    
    return {
      status: response.status,
      message: data.message || 'An error occurred',
    };
  } catch {
    return {
      status: response.status,
      message: response.statusText || 'An error occurred',
    };
  }
}

// Refresh token handler
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenManager.getRefreshToken();
  
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      tokenManager.clearTokens();
      return null;
    }

    // In a real implementation, the new tokens would be returned
    // For now, we assume cookies are being used
    return tokenManager.getAccessToken();
  } catch {
    tokenManager.clearTokens();
    return null;
  }
}

// Request options type
interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

// Main API client
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  // Add auth token if available and not skipped
  if (!skipAuth) {
    const token = tokenManager.getAccessToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  let response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Include cookies for refresh token
  });

  // Handle 401 - attempt token refresh
  if (response.status === 401 && !skipAuth) {
    if (!isRefreshing) {
      isRefreshing = true;
      
      const newToken = await refreshAccessToken();
      isRefreshing = false;

      if (newToken) {
        onTokenRefreshed(newToken);
        
        // Retry the original request
        (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, {
          ...fetchOptions,
          headers,
          credentials: 'include',
        });
      } else {
        // Redirect to login
        window.location.href = '/login';
        throw new ApiClientError({ status: 401, message: 'Session expired' });
      }
    } else {
      // Wait for the token refresh to complete
      await new Promise<string>((resolve) => {
        subscribeTokenRefresh(resolve);
      });
      
      // Retry with new token
      const token = tokenManager.getAccessToken();
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        response = await fetch(url, {
          ...fetchOptions,
          headers,
          credentials: 'include',
        });
      }
    }
  }

  // Handle errors
  if (!response.ok) {
    const error = await parseErrorResponse(response);
    throw new ApiClientError(error);
  }

  // Handle empty responses
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0' || response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
