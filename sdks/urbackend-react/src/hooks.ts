import { useCallback } from 'react';
import { useUrContext } from './context';
import type { 
  LoginPayload, 
  SignUpPayload, 
  ChangePasswordPayload,
  VerifyEmailPayload,
  RequestPasswordResetPayload,
  ResetPasswordPayload
} from '@urbackend/sdk';

export const useAuth = () => {
  const { auth, user, setUser, isInitializing, isLoading, setIsLoading, error, setError } = useUrContext();

  if (!auth) {
    throw new Error('Auth module not initialized. Make sure you are inside UrProvider.');
  }

  const login = useCallback(async (payload: LoginPayload) => {
    try {
      setError(null);
      setIsLoading(true);
      const res = await auth.login(payload);
      const token = res.accessToken || (res as any).token;
      if (token && typeof window !== 'undefined') localStorage.setItem('ur_auth_token', token);
      const currentUser = await auth.me();
      setUser(currentUser);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [auth, setUser, setIsLoading, setError]);

  const signUp = useCallback(async (payload: SignUpPayload) => {
    try {
      setError(null);
      setIsLoading(true);
      const newUser = await auth.signUp(payload);
      return newUser;
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [auth, setIsLoading, setError]);

  const logout = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      await auth.logout();
      if (typeof window !== 'undefined') localStorage.removeItem('ur_auth_token');
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Logout failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [auth, setUser, setIsLoading, setError]);

  const socialLogin = useCallback((provider: 'google' | 'github') => {
    setError(null);
    const url = auth.socialStart(provider);
    window.location.href = url;
  }, [auth, setError]);
  
  const verifyEmail = useCallback(async (payload: VerifyEmailPayload) => {
    try {
      setError(null);
      return await auth.verifyEmail(payload);
    } catch (err: any) {
      setError(err.message || 'Email verification failed');
      throw err;
    }
  }, [auth, setError]);

  const changePassword = useCallback(async (payload: ChangePasswordPayload) => {
    try {
      setError(null);
      return await auth.changePassword(payload);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
      throw err;
    }
  }, [auth, setError]);

  const requestPasswordReset = useCallback(async (payload: RequestPasswordResetPayload) => {
    try {
      setError(null);
      setIsLoading(true);
      return await auth.requestPasswordReset(payload);
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [auth, setError, setIsLoading]);

  const resetPassword = useCallback(async (payload: ResetPasswordPayload) => {
    try {
      setError(null);
      setIsLoading(true);
      return await auth.resetPassword(payload);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [auth, setError, setIsLoading]);

  const clearError = useCallback(() => setError(null), [setError]);

  return {
    user,
    isInitializing,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    signUp,
    logout,
    socialLogin,
    verifyEmail,
    changePassword,
    requestPasswordReset,
    resetPassword,
    clearError,
    authApi: auth // Escape hatch to underlying SDK
  };
};

export const useUser = () => {
  const { user, isInitializing, isLoading, error } = useUrContext();
  return {
    user,
    isInitializing,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
};

export const useDb = () => {
  const { db } = useUrContext();
  if (!db) {
    throw new Error('Database module not initialized.');
  }
  return db;
};

export const useStorage = () => {
  const { storage } = useUrContext();
  if (!storage) {
    throw new Error('Storage module not initialized.');
  }
  return storage;
};
