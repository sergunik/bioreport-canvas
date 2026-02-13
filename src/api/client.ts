import { ApiError, ValidationError } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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

let isRefreshing = false;
let refreshQueue: Array<{ resolve: () => void; reject: (err: unknown) => void }> = [];

function drainRefreshQueue(error?: unknown) {
  refreshQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()));
  refreshQueue = [];
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      const refreshed = await refreshAccessToken();
      isRefreshing = false;

      if (refreshed) {
        drainRefreshQueue();
        response = await fetch(url, { ...options, headers, credentials: 'include' });
      } else {
        const err = new ApiClientError({ status: 401, message: 'Session expired' });
        drainRefreshQueue(err);
        throw err;
      }
    } else {
      await new Promise<void>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      });
      response = await fetch(url, { ...options, headers, credentials: 'include' });
    }
  }

  if (!response.ok) {
    const error = await parseErrorResponse(response);
    throw new ApiClientError(error);
  }

  const contentLength = response.headers.get('content-length');
  if (contentLength === '0' || response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit & { data?: unknown }) => {
    const { data, ...rest } = options ?? {};
    return apiClient<T>(endpoint, {
      ...rest,
      method: 'DELETE',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  },
};

export default api;
