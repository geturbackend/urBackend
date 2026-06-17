import React from 'react';
import * as _urbackend_sdk from '@urbackend/sdk';
import { UrBackendClient, AuthModule, DatabaseModule, StorageModule, AuthUser, LoginPayload, SignUpPayload, VerifyEmailPayload, ChangePasswordPayload, RequestPasswordResetPayload, ResetPasswordPayload } from '@urbackend/sdk';
export * from '@urbackend/sdk';

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
interface UrProviderProps {
    apiKey: string;
    baseUrl?: string;
    children: React.ReactNode;
}
declare const UrProvider: React.FC<UrProviderProps>;
declare const useUrContext: () => UrContextValue;

declare const useAuth: () => {
    user: _urbackend_sdk.AuthUser | null;
    isInitializing: boolean;
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    login: (payload: LoginPayload) => Promise<void>;
    signUp: (payload: SignUpPayload) => Promise<_urbackend_sdk.AuthUser>;
    logout: () => Promise<void>;
    socialLogin: (provider: "google" | "github") => void;
    verifyEmail: (payload: VerifyEmailPayload) => Promise<{
        message: string;
    }>;
    changePassword: (payload: ChangePasswordPayload) => Promise<{
        message: string;
    }>;
    requestPasswordReset: (payload: RequestPasswordResetPayload) => Promise<{
        message: string;
    }>;
    resetPassword: (payload: ResetPasswordPayload) => Promise<{
        message: string;
    }>;
    clearError: () => void;
    authApi: _urbackend_sdk.AuthModule;
};
declare const useUser: () => {
    user: _urbackend_sdk.AuthUser | null;
    isInitializing: boolean;
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;
};
declare const useDb: () => _urbackend_sdk.DatabaseModule;
declare const useStorage: () => _urbackend_sdk.StorageModule;

interface ProtectedRouteProps {
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
declare const ProtectedRoute: React.FC<ProtectedRouteProps>;
interface GuestRouteProps {
    children: React.ReactNode;
    redirectTo?: string;
    fallback?: React.ReactNode;
    onRedirect?: () => void;
}
/**
 * A wrapper component that requires the user to NOT be authenticated (e.g. for Login pages).
 * If the user IS authenticated, they will be redirected to the specified route.
 */
declare const GuestRoute: React.FC<GuestRouteProps>;

type AuthProvider = 'google' | 'github';
type ThemeMode = 'light' | 'dark';
interface AuthColors {
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    inputBackground: string;
    primary: string;
    primaryColor?: string;
    primaryText: string;
    footerBackground: string;
    dividerText: string;
    socialButtonBackground: string;
}
interface AuthBranding {
    brandName?: string;
    appName?: string;
    title?: string;
    subtitle?: string;
    logo?: React.ReactNode | string;
    logoUrl?: string;
    primaryColor?: string;
}
interface AuthLabels {
    loginTab: string;
    signupTab: string;
    loginTitle: string;
    signupTitle: string;
    forgotTitle: string;
    resetTitle: string;
    loginButton: string;
    signupButton: string;
    forgotButton: string;
    resetButton: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    nameLabel: string;
    namePlaceholder: string;
    otpLabel: string;
    otpPlaceholder: string;
    forgotPasswordLink: string;
    socialDivider: string;
    googleButton: string;
    githubButton: string;
    footerSigninPrompt: string;
    footerSignupPrompt: string;
    footerForgotPrompt: string;
    noAuthMethods: string;
    forgotSubtitle: string;
    resetSubtitle: string;
    signInTitle?: string;
    signUpTitle?: string;
    signInTab?: string;
    signUpTab?: string;
    signInButton?: string;
    signUpButton?: string;
}
interface UrAuthProps {
    providers?: AuthProvider[] | {
        google?: boolean;
        github?: boolean;
        emailPassword?: boolean;
    };
    enableEmailPassword?: boolean;
    theme?: ThemeMode;
    colors?: Partial<AuthColors>;
    branding?: AuthBranding;
    labels?: Partial<AuthLabels>;
    onSuccess?: () => void;
}
declare const UrAuth: React.FC<UrAuthProps>;

interface UrUserButtonProps {
    /**
     * Shape of the profile avatar. Defaults to 'square' as requested.
     */
    shape?: 'square' | 'circle';
    /**
     * Position of the button on the screen. Defaults to 'top-right'.
     * Use 'inline' if you want to place it within a normal flex/grid layout instead of absolute positioning.
     */
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline';
    /**
     * Called when "Profile" is clicked.
     */
    onProfileClick?: () => void;
    /**
     * Called when "Settings" is clicked.
     */
    onSettingsClick?: () => void;
    /**
     * Z-index for the fixed container. Defaults to 999.
     */
    zIndex?: number;
}
declare const UrUserButton: React.FC<UrUserButtonProps>;

export { GuestRoute, type GuestRouteProps, ProtectedRoute, type ProtectedRouteProps, UrAuth, type UrAuthProps, UrProvider, type UrProviderProps, UrUserButton, type UrUserButtonProps, useAuth, useDb, useStorage, useUrContext, useUser };
