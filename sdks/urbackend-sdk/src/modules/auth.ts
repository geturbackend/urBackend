import { UrBackendClient } from '../client';
import {
  AuthUser,
  AuthResponse,
  SignUpPayload,
  LoginPayload,
  UpdateProfilePayload,
  ChangePasswordPayload,
  VerifyEmailPayload,
  ResendOtpPayload,
  RequestPasswordResetPayload,
  ResetPasswordPayload,
  SocialExchangePayload,
  SocialExchangeResponse,
  RequestOptions,
} from '../types';
import { AuthError } from '../errors';

/**
 * Module for authentication and user management in urBackend
 * 
 * @class AuthModule
 * @description Provides complete authentication functionality including signup, login,
 * profile management, password operations, email verification, social authentication,
 * and session management. Manages session tokens automatically.
 * 
 * @example
 * // Initialize the auth module
 * const client = new UrBackendClient({ apiKey: 'pk_live_xxx', secretKey: 'sk_live_xxx' });
 * const auth = new AuthModule(client);
 * 
 * // Sign up a new user
 * const user = await auth.signUp({
 *   email: 'user@example.com',
 *   password: 'securePassword123',
 *   name: 'John Doe'
 * });
 * 
 * @example
 * // Log in and manage session
 * const session = await auth.login({
 *   email: 'user@example.com',
 *   password: 'securePassword123'
 * });
 * console.log('Access token:', session.accessToken);
 * 
 * // Get current user profile
 * const profile = await auth.me();
 * console.log('Welcome:', profile.name);
 */
export class AuthModule {
  private sessionToken?: string;

  /**
   * Creates an instance of AuthModule
   * 
   * @param {UrBackendClient} client - The urBackend client instance
   * 
   * @example
   * const client = new UrBackendClient({ apiKey: 'pk_live_xxx' });
   * const auth = new AuthModule(client);
   */
  constructor(private client: UrBackendClient) {}

  /**
   * Creates a new user account
   * 
   * @param {SignUpPayload} payload - User registration data
   * @param {string} payload.email - User's email address
   * @param {string} payload.password - User's password
   * @param {string} payload.name - User's full name
   * @returns {Promise<AuthUser>} Promise resolving to the created user object
   * 
   * @throws {AuthError} If email already exists
   * @throws {AuthError} If password does not meet requirements
   * @throws {AuthError} If validation fails
   * 
   * @example
   * // Sign up a new user
   * const user = await auth.signUp({
   *   email: 'john@example.com',
   *   password: 'StrongP@ss123',
   *   name: 'John Doe'
   * });
   * console.log('User created:', user._id);
   * 
   * @example
   * // Sign up with error handling
   * try {
   *   const user = await auth.signUp({
   *     email: 'existing@email.com',
   *     password: 'weak',
   *     name: 'Test'
   *   });
   * } catch (error) {
   *   if (error.message.includes('email')) {
   *     console.log('Email already registered');
   *   } else if (error.message.includes('password')) {
   *     console.log('Password too weak');
   *   }
   * }
   */
  public async signUp(payload: SignUpPayload): Promise<AuthUser> {
    return this.client.request<AuthUser>('POST', '/api/userAuth/signup', { body: payload });
  }

  /**
   * Authenticates an existing user and stores the session token
   * 
   * @param {LoginPayload} payload - User login credentials
   * @param {string} payload.email - User's email address
   * @param {string} payload.password - User's password
   * @returns {Promise<AuthResponse>} Promise resolving to authentication response with tokens
   * 
   * @throws {AuthError} If credentials are invalid
   * @throws {AuthError} If account is locked or not verified
   * 
   * @example
   * // Log in a user
   * const response = await auth.login({
   *   email: 'john@example.com',
   *   password: 'StrongP@ss123'
   * });
   * console.log('Access token:', response.accessToken);
   * 
   * @example
   * // Login with error handling
   * try {
   *   const { accessToken, user } = await auth.login({
   *     email: 'user@example.com',
   *     password: 'wrongpassword'
   *   });
   * } catch (error) {
   *   if (error.status === 401) {
   *     console.log('Invalid email or password');
   *   }
   * }
   */
  public async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await this.client.request<AuthResponse>('POST', '/api/userAuth/login', {
      body: payload,
    });

    this.sessionToken = response.accessToken || response.token;

    if (!response.accessToken && response.token) {
      console.warn(
        'urbackend-sdk: The server returned "token" which is deprecated. Please update your backend to return "accessToken".',
      );
    }

    return response;
  }

  /**
   * Retrieves the current authenticated user's profile
   * 
   * @param {string} [token] - Optional authentication token (overrides stored token)
   * @returns {Promise<AuthUser>} Promise resolving to the authenticated user's profile
   * 
   * @throws {AuthError} If no authentication token is provided
   * @throws {AuthError} If token is invalid or expired
   * 
   * @example
   * // Get current user profile (uses stored token from login)
   * const user = await auth.me();
   * console.log(`Hello ${user.name}, your email is ${user.email}`);
   * 
   * @example
   * // Get profile with custom token
   * const user = await auth.me(customToken);
   * 
   * @example
   * // Get profile with error handling
   * try {
   *   const user = await auth.me();
   *   console.log('Authenticated as:', user.email);
   * } catch (error) {
   *   if (error.status === 401) {
   *     console.log('Please log in again');
   *   }
   * }
   */
  public async me(token?: string): Promise<AuthUser> {
    const activeToken = token || this.sessionToken;

    if (!activeToken) {
      throw new AuthError(
        'Authentication token is required for /me endpoint',
        401,
        '/api/userAuth/me',
      );
    }

    return this.client.request<AuthUser>('GET', '/api/userAuth/me', { token: activeToken });
  }

  /**
   * Updates the current authenticated user's profile
   * 
   * @param {UpdateProfilePayload} payload - Profile data to update
   * @param {string} [payload.name] - Updated name
   * @param {string} [payload.email] - Updated email (may require re-verification)
   * @param {string} [token] - Optional authentication token (overrides stored token)
   * @returns {Promise<{ message: string }>} Promise resolving to success message
   * 
   * @throws {AuthError} If no authentication token is provided
   * @throws {AuthError} If token is invalid or expired
   * @throws {AuthError} If email is already taken
   * 
   * @example
   * // Update user's name
   * const result = await auth.updateProfile({ name: 'Jane Smith' });
   * console.log(result.message);
   * 
   * @example
   * // Update multiple fields
   * const result = await auth.updateProfile({
   *   name: 'Jane Doe',
   *   email: 'jane@newemail.com'
   * });
   * 
   * @example
   * // Update with error handling
   * try {
   *   await auth.updateProfile({ email: 'taken@email.com' });
   * } catch (error) {
   *   console.log('Email already in use');
   * }
   */
  public async updateProfile(payload: UpdateProfilePayload, token?: string): Promise<{ message: string }> {
    const activeToken = token || this.sessionToken;
    if (!activeToken) {
      throw new AuthError('Authentication token is required to update profile', 401, '/api/userAuth/update-profile');
    }
    return this.client.request<{ message: string }>('PUT', '/api/userAuth/update-profile', {
      body: payload,
      token: activeToken,
    });
  }

  /**
   * Changes the current authenticated user's password
   * 
   * @param {ChangePasswordPayload} payload - Password change data
   * @param {string} payload.currentPassword - User's current password
   * @param {string} payload.newPassword - Desired new password
   * @param {string} [token] - Optional authentication token (overrides stored token)
   * @returns {Promise<{ message: string }>} Promise resolving to success message
   * 
   * @throws {AuthError} If no authentication token is provided
   * @throws {AuthError} If current password is incorrect
   * @throws {AuthError} If new password does not meet requirements
   * 
   * @example
   * // Change password
   * const result = await auth.changePassword({
   *   currentPassword: 'oldPassword123',
   *   newPassword: 'newStrongP@ss456'
   * });
   * console.log(result.message);
   * 
   * @example
   * // Change password with error handling
   * try {
   *   await auth.changePassword({
   *     currentPassword: 'wrong',
   *     newPassword: 'newPassword123'
   *   });
   * } catch (error) {
   *   if (error.message.includes('current password')) {
   *     console.log('Current password is incorrect');
   *   }
   * }
   */
  public async changePassword(payload: ChangePasswordPayload, token?: string): Promise<{ message: string }> {
    const activeToken = token || this.sessionToken;
    if (!activeToken) {
      throw new AuthError('Authentication token is required to change password', 401, '/api/userAuth/change-password');
    }
    return this.client.request<{ message: string }>('PUT', '/api/userAuth/change-password', {
      body: payload,
      token: activeToken,
    });
  }

  /**
   * Verifies user's email address using OTP
   * 
   * @param {VerifyEmailPayload} payload - Email verification data
   * @param {string} payload.email - User's email address
   * @param {string} payload.otp - One-time password sent to email
   * @returns {Promise<{ message: string }>} Promise resolving to success message
   * 
   * @throws {AuthError} If OTP is invalid or expired
   * @throws {AuthError} If email is not found
   * 
   * @example
   * // Verify email with OTP
   * const result = await auth.verifyEmail({
   *   email: 'user@example.com',
   *   otp: '123456'
   * });
   * console.log('Email verified:', result.message);
   * 
   * @example
   * // Verify with error handling
   * try {
   *   await auth.verifyEmail({ email: 'user@example.com', otp: '000000' });
   * } catch (error) {
   *   console.log('Invalid OTP. Please try again.');
   * }
   */
  public async verifyEmail(payload: VerifyEmailPayload): Promise<{ message: string }> {
    return this.client.request<{ message: string }>('POST', '/api/userAuth/verify-email', {
      body: payload,
    });
  }

  /**
   * Resends verification OTP to user's email
   * 
   * @param {ResendOtpPayload} payload - Resend OTP request data
   * @param {string} payload.email - User's email address
   * @returns {Promise<{ message: string }>} Promise resolving to success message
   * 
   * @throws {AuthError} If email is not found
   * @throws {AuthError} If too many attempts
   * 
   * @example
   * // Resend verification OTP
   * const result = await auth.resendVerificationOtp({
   *   email: 'user@example.com'
   * });
   * console.log('OTP resent:', result.message);
   */
  public async resendVerificationOtp(payload: ResendOtpPayload): Promise<{ message: string }> {
    return this.client.request<{ message: string }>('POST', '/api/userAuth/resend-verification-otp', {
      body: payload,
    });
  }

  /**
   * Requests a password reset OTP to be sent to user's email
   * 
   * @param {RequestPasswordResetPayload} payload - Password reset request data
   * @param {string} payload.email - User's email address
   * @returns {Promise<{ message: string }>} Promise resolving to success message
   * 
   * @throws {AuthError} If email is not found
   * @throws {AuthError} If too many attempts
   * 
   * @example
   * // Request password reset
   * const result = await auth.requestPasswordReset({
   *   email: 'user@example.com'
   * });
   * console.log('Reset OTP sent:', result.message);
   */
  public async requestPasswordReset(payload: RequestPasswordResetPayload): Promise<{ message: string }> {
    return this.client.request<{ message: string }>('POST', '/api/userAuth/request-password-reset', {
      body: payload,
    });
  }

  /**
   * Resets user's password using OTP
   * 
   * @param {ResetPasswordPayload} payload - Password reset data
   * @param {string} payload.email - User's email address
   * @param {string} payload.otp - One-time password sent via email
   * @param {string} payload.newPassword - Desired new password
   * @returns {Promise<{ message: string }>} Promise resolving to success message
   * 
   * @throws {AuthError} If OTP is invalid or expired
   * @throws {AuthError} If email is not found
   * @throws {AuthError} If new password does not meet requirements
   * 
   * @example
   * // Reset password with OTP
   * const result = await auth.resetPassword({
   *   email: 'user@example.com',
   *   otp: '123456',
   *   newPassword: 'NewStrongP@ss789'
   * });
   * console.log('Password reset:', result.message);
   * 
   * @example
   * // Reset password with error handling
   * try {
   *   await auth.resetPassword({
   *     email: 'user@example.com',
   *     otp: 'wrong',
   *     newPassword: 'newPass123'
   *   });
   * } catch (error) {
   *   console.log('Invalid OTP. Please request a new one.');
   * }
   */
  public async resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
    return this.client.request<{ message: string }>('POST', '/api/userAuth/reset-password', {
      body: payload,
    });
  }

  /**
   * Retrieves a public-safe user profile by username
   * 
   * @param {string} username - Username of the user to fetch
   * @returns {Promise<AuthUser>} Promise resolving to public user profile (sensitive fields omitted)
   * 
   * @throws {AuthError} If user with given username does not exist
   * 
   * @example
   * // Get public profile
   * const profile = await auth.publicProfile('john_doe');
   * console.log(`${profile.name} joined on ${profile.createdAt}`);
   * 
   * @example
   * // Display user profile on a public page
   * try {
   *   const user = await auth.publicProfile('username');
   *   // Show user info (no email or private data)
   * } catch (error) {
   *   console.log('User not found');
   * }
   */
  public async publicProfile(username: string): Promise<AuthUser> {
    return this.client.request<AuthUser>('GET', `/api/userAuth/public/${username}`);
  }

  /**
   * Refreshes the access token using refresh token or cookie
   * 
   * @param {string} [refreshToken] - Optional refresh token for header mode. If omitted, uses cookie mode.
   * @returns {Promise<AuthResponse>} Promise resolving to new authentication response with fresh tokens
   * 
   * @throws {AuthError} If refresh token is invalid or expired
   * 
   * @example
   * // Refresh token using cookie (if configured)
   * const newTokens = await auth.refreshToken();
   * console.log('New access token:', newTokens.accessToken);
   * 
   * @example
   * // Refresh token using explicit refresh token
   * const newTokens = await auth.refreshToken(storedRefreshToken);
   * 
   * @example
   * // Auto-refresh before API calls
   * try {
   *   await auth.me();
   * } catch (error) {
   *   if (error.status === 401) {
   *     await auth.refreshToken();
   *     // Retry the original request
   *   }
   * }
   */
  public async refreshToken(refreshToken?: string): Promise<AuthResponse> {
    const options: RequestOptions = {};
    if (refreshToken) {
      options.headers = { 'x-refresh-token': refreshToken, 'x-refresh-token-mode': 'header' };
    } else {
      options.credentials = 'include';
    }

    const response = await this.client.request<AuthResponse>('POST', '/api/userAuth/refresh-token', options);
    this.sessionToken = response.accessToken || response.token;
    return response;
  }

  /**
   * Returns the start URL for social authentication
   * 
   * @param {('github' | 'google')} provider - The social authentication provider
   * @returns {string} URL to redirect the user's browser to begin the OAuth flow
   * 
   * @example
   * // Redirect user to social login page
   * const githubUrl = auth.socialStart('github');
   * window.location.href = githubUrl;
   * 
   * @example
   * // For Node.js backend
   * const googleUrl = auth.socialStart('google');
   * res.redirect(googleUrl);
   */
  public socialStart(provider: 'github' | 'google'): string {
    return `${this.client.getBaseUrl()}/api/userAuth/social/${provider}/start?key=${this.client.getApiKey()}`;
  }

  /**
   * Exchanges social authentication rtCode for a refresh token
   * 
   * @param {SocialExchangePayload} payload - Social exchange data
   * @param {string} payload.rtCode - Return code from social provider
   * @param {string} payload.provider - Social provider ('github' or 'google')
   * @returns {Promise<SocialExchangeResponse>} Promise resolving to authentication response
   * 
   * @throws {AuthError} If rtCode is invalid or expired
   * @throws {AuthError} If social provider fails
   * 
   * @example
   * // After user returns from social login
   * const rtCode = new URLSearchParams(window.location.search).get('rtCode');
   * if (rtCode) {
   *   const response = await auth.socialExchange({
   *     rtCode: rtCode,
   *     provider: 'github'
   *   });
   *   console.log('Social login successful:', response.accessToken);
   * }
   */
  public async socialExchange(payload: SocialExchangePayload): Promise<SocialExchangeResponse> {
    return this.client.request<SocialExchangeResponse>('POST', '/api/userAuth/social/exchange', {
      body: payload,
    });
  }

  /**
   * Revokes the current session and clears local state
   * 
   * @param {string} [token] - Optional authentication token (overrides stored token)
   * @returns {Promise<{ success: boolean; message: string }>} Promise resolving to logout status
   * 
   * @example
   * // Log out current user
   * const result = await auth.logout();
   * console.log(result.message);
   * // User is now logged out, session token is cleared
   * 
   * @example
   * // Log out with custom token
   * const result = await auth.logout(customToken);
   * 
   * @example
   * // Logout after API calls
   * try {
   *   await auth.logout();
   *   // Redirect to login page
   *   window.location.href = '/login';
   * } catch (error) {
   *   console.log('Logout failed, but local session cleared');
   * }
   */
  public async logout(token?: string): Promise<{ success: boolean; message: string }> {
    const activeToken = token || this.sessionToken;
    let result = { success: true, message: 'Logged out locally' };

    if (activeToken) {
      try {
        result = await this.client.request<{ success: boolean; message: string }>(
          'POST',
          '/api/userAuth/logout',
          { token: activeToken, credentials: 'include' },
        );
      } catch (e) {
        // Silently fail if server logout fails, we still want to clear local state
        console.warn('urbackend-sdk: Server logout failed', e);
      }
    }

    this.sessionToken = undefined;
    return result;
  }

  /**
   * Manually sets the session token (e.g., after social authentication exchange)
   * 
   * @param {string} token - The session/access token to store
   * 
   * @example
   * // After successful social exchange
   * const response = await auth.socialExchange({ rtCode, provider: 'github' });
   * auth.setToken(response.accessToken);
   * 
   * @example
   * // Restore session from localStorage
   * const savedToken = localStorage.getItem('authToken');
   * if (savedToken) {
   *   auth.setToken(savedToken);
   *   const user = await auth.me();
   * }
   */
  public setToken(token: string): void {
    this.sessionToken = token;
  }

  /**
   * Gets the current stored session token
   * 
   * @returns {string | undefined} The current session token, if any
   * 
   * @example
   * // Get token for custom API calls
   * const token = auth.getToken();
   * if (token) {
   *   // Use token in custom API request
   *   fetch('/api/custom', { headers: { Authorization: `Bearer ${token}` } });
   * }
   * 
   * @example
   * // Save token to localStorage for persistence
   * const token = auth.getToken();
   * if (token) {
   *   localStorage.setItem('authToken', token);
   * }
   */
  public getToken(): string | undefined {
    return this.sessionToken;
  }
}