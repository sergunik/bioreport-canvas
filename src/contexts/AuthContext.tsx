import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { User, Account, AuthState } from '@/types/api';
import { authService, accountService, tokenManager, ApiClientError } from '@/api';

// ==================== Types ====================

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
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'LOGOUT' }
  | { type: 'INIT_COMPLETE'; payload: { user: User | null; account: Account | null } };

// ==================== Initial State ====================

const initialState: AuthState = {
  user: null,
  account: null,
  isAuthenticated: false,
  isLoading: true,
  hasCompletedSetup: false,
};

// ==================== Reducer ====================

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
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
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

// ==================== Context ====================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ==================== Provider ====================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      // Check if we have tokens
      if (!tokenManager.hasTokens()) {
        dispatch({ type: 'INIT_COMPLETE', payload: { user: null, account: null } });
        return;
      }

      try {
        // Try to get account info
        const account = await accountService.getAccount();
        
        // If we get account, user is authenticated
        dispatch({
          type: 'INIT_COMPLETE',
          payload: {
            user: { id: account.id, email: '' }, // We don't have email from account endpoint
            account,
          },
        });
      } catch (error) {
        // If error, tokens might be invalid
        if (error instanceof ApiClientError && error.isAuthError()) {
          tokenManager.clearTokens();
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
      
      // Set mock user (in real app, this would come from login response)
      const user: User = { id: 'user-1', email };
      dispatch({ type: 'SET_USER', payload: user });

      // Try to fetch account
      try {
        const account = await accountService.getAccount();
        dispatch({ type: 'SET_ACCOUNT', payload: account });
      } catch {
        // Account doesn't exist yet, user needs to complete setup
        dispatch({ type: 'SET_ACCOUNT', payload: null });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await authService.register({ email, password });
      
      const user: User = {
        id: response.user.id,
        email: response.user.email,
      };
      
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_ACCOUNT', payload: null }); // New user needs setup
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Even if logout fails on server, clear local state
    }
    
    tokenManager.clearTokens();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const refreshAccount = useCallback(async () => {
    try {
      const account = await accountService.getAccount();
      dispatch({ type: 'SET_ACCOUNT', payload: account });
    } catch {
      // Handle error silently
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

// ==================== Hook ====================

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext;
