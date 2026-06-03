import React, { useEffect } from 'react';
import { useUser } from './hooks';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
  onRedirect?: () => void;
}

/**
 * A wrapper component that requires the user to be authenticated.
 * If the user is not authenticated after initialization, they will be redirected,
 * or the fallback will be rendered (or nothing if fallback is not provided and no window redirect occurs).
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login', 
  fallback = null,
  onRedirect
}) => {
  const { isAuthenticated, isInitializing } = useUser();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      if (onRedirect) {
        onRedirect();
      } else if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
  }, [isAuthenticated, isInitializing, redirectTo, onRedirect]);

  if (isInitializing) {
    return fallback;
  }

  if (!isAuthenticated) {
    return fallback;
  }

  return <>{children}</>;
};

export interface GuestRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
  onRedirect?: () => void;
}

/**
 * A wrapper component that requires the user to NOT be authenticated (e.g. for Login pages).
 * If the user IS authenticated, they will be redirected to the specified route.
 */
export const GuestRoute: React.FC<GuestRouteProps> = ({
  children,
  redirectTo = '/dashboard',
  fallback = null,
  onRedirect
}) => {
  const { isAuthenticated, isInitializing } = useUser();

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      if (onRedirect) {
        onRedirect();
      } else if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
  }, [isAuthenticated, isInitializing, redirectTo, onRedirect]);

  if (isInitializing) {
    return fallback;
  }

  if (isAuthenticated) {
    return fallback;
  }

  return <>{children}</>;
};
