import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { UrBackendClient, AuthModule, DatabaseModule, StorageModule } from '@urbackend/sdk';
import type { AuthUser } from '@urbackend/sdk';

interface UrContextValue {
  client: UrBackendClient | null;
  auth: AuthModule | null;
  db: DatabaseModule | null;
  storage: StorageModule | null;
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  isInitializing: boolean;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

const UrContext = createContext<UrContextValue | undefined>(undefined);

export interface UrProviderProps {
  apiKey: string;
  baseUrl?: string;
  children: React.ReactNode;
}

export const UrProvider: React.FC<UrProviderProps> = ({ apiKey, baseUrl, children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { client, auth, db, storage } = useMemo(() => {
    const _client = new UrBackendClient({ apiKey, baseUrl });
    return {
      client: _client,
      auth: _client.auth,
      db: _client.db,
      storage: _client.storage,
    };
  }, [apiKey, baseUrl]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Hydrate from localStorage first as a fallback for environments without cookies
        if (typeof window !== 'undefined') {
          const savedToken = localStorage.getItem('ur_auth_token');
          if (savedToken) auth.setToken(savedToken);
        }

        // Check for social auth callback params
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const token = hashParams.get('token');
        const rtCode = urlParams.get('rtCode');
        const error = urlParams.get('error');

        if (error) {
          console.error('Social Auth Error:', error);
          if (mounted) setError(error);
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (token) {
          // Social auth succeeded, establish session immediately
          auth.setToken(token);
          if (typeof window !== 'undefined') localStorage.setItem('ur_auth_token', token);
          
          if (rtCode) {
            // Exchange for long-lived refresh token
            try {
              const exRes = await auth.socialExchange({ token, rtCode });
              const exToken = (exRes as any).accessToken || (exRes as any).token;
              if (exToken && typeof window !== 'undefined') localStorage.setItem('ur_auth_token', exToken);
            } catch (err: any) {
              console.error('Failed to exchange refresh token', err);
              if (mounted) setError(err.message || 'Failed to complete social login');
              throw err;
            }
          }
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          // Attempt to silently refresh session using the HTTP-only cookie
          try {
            const res = await auth.refreshToken();
            const newToken = res.accessToken || (res as any).token;
            if (newToken && typeof window !== 'undefined') localStorage.setItem('ur_auth_token', newToken);
          } catch (e) {
            // If refresh fails, me() will catch it
          }
        }
        
        const currentUser = await auth.me();
        if (mounted) {
          setUser(currentUser);
        }
      } catch (error: any) {
        console.error("InitAuth Error:", error);
        if (mounted) {
          setUser(null);
          // Don't set global error for initial me() check failure (usually just means not logged in)
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [auth]);

  const value: UrContextValue = {
    client,
    auth,
    db,
    storage,
    user,
    setUser,
    isInitializing,
    isLoading,
    setIsLoading,
    error,
    setError,
  };

  return <UrContext.Provider value={value}>{children}</UrContext.Provider>;
};

export const useUrContext = () => {
  const context = useContext(UrContext);
  if (!context) {
    throw new Error('useUrContext must be used within an UrProvider');
  }
  return context;
};
