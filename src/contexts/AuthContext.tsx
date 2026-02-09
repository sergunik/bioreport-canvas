import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { User, Account, AuthState } from '@/types/api';
import { authService, accountService, ApiClientError } from '@/api';

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccount: () => Promise<void>;
  setAccount: (account: Account) => void;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ACCOUNT'; payload: Account | null }
  | { type: 'LOGOUT' }
  | { type: 'INIT_COMPLETE'; payload: { user: User | null; account: Account | null } };

const initialState: AuthState = {
  user: null,
  account: null,
  isAuthenticated: false,
  isLoading: true,
  hasCompletedSetup: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };
    case 'SET_ACCOUNT':
      return {
        ...state,
        account: action.payload,
        hasCompletedSetup: !!action.payload,
      };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'INIT_COMPLETE':
      return {
        ...state,
        user: action.payload.user,
        account: action.payload.account,
        isAuthenticated: !!action.payload.user,
        hasCompletedSetup: !!action.payload.account,
        isLoading: false,
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

async function fetchAccountOrNull(): Promise<Account | null> {
  try {
    return await accountService.getAccount();
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 404 || error.status === 409)) {
      return null;
    }
    throw error;
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const account = await accountService.getAccount();
        dispatch({
          type: 'INIT_COMPLETE',
          payload: { user: { id: account.id, email: '' }, account },
        });
      } catch (error) {
        if (error instanceof ApiClientError && error.isAuthError()) {
          dispatch({ type: 'INIT_COMPLETE', payload: { user: null, account: null } });
          return;
        }

        if (error instanceof ApiClientError && error.status === 404) {
          dispatch({
            type: 'INIT_COMPLETE',
            payload: { user: { id: '', email: '' }, account: null },
          });
          return;
        }

        dispatch({ type: 'INIT_COMPLETE', payload: { user: null, account: null } });
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      await authService.login({ email, password });

      const user: User = { id: '', email };
      dispatch({ type: 'SET_USER', payload: user });

      const account = await fetchAccountOrNull();
      dispatch({ type: 'SET_ACCOUNT', payload: account });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await authService.register({ email, password });
      const user: User = { id: response.user.id, email: response.user.email };
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_ACCOUNT', payload: null });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Clear local state even if server call fails
    }
    dispatch({ type: 'LOGOUT' });
  }, []);

  const refreshAccount = useCallback(async () => {
    try {
      const account = await accountService.getAccount();
      dispatch({ type: 'SET_ACCOUNT', payload: account });
    } catch {
      // Silently ignore
    }
  }, []);

  const setAccount = useCallback((account: Account) => {
    dispatch({ type: 'SET_ACCOUNT', payload: account });
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    refreshAccount,
    setAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default AuthContext;
