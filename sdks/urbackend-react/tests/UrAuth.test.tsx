import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UrAuth } from '../src/components/UrAuth';

// Mock the hooks module
const mockLogin = vi.fn();
const mockSignUp = vi.fn();
const mockSocialLogin = vi.fn();
const mockRequestPasswordReset = vi.fn();
const mockResetPassword = vi.fn();
const mockClearError = vi.fn();

vi.mock('../src/hooks', () => ({
  useAuth: () => ({
    login: mockLogin,
    signUp: mockSignUp,
    socialLogin: mockSocialLogin,
    requestPasswordReset: mockRequestPasswordReset,
    resetPassword: mockResetPassword,
    isLoading: false,
    error: null,
    clearError: mockClearError,
  }),
}));

describe('UrAuth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form by default', () => {
    render(<UrAuth />);
    
    expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
  });

  it('switches to signup form', () => {
    render(<UrAuth />);
    
    const signupToggle = screen.getAllByText('Sign Up')[0]; // Top switcher
    fireEvent.click(signupToggle);
    
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('calls login on submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<UrAuth onSuccess={() => {}} />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter your email address'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
    });
  });

  it('calls socialLogin when a provider button is clicked', () => {
    render(<UrAuth providers={['google', 'github']} />);
    
    fireEvent.click(screen.getByText('Continue with Google'));
    expect(mockSocialLogin).toHaveBeenCalledWith('google');
    
    fireEvent.click(screen.getByText('Continue with GitHub'));
    expect(mockSocialLogin).toHaveBeenCalledWith('github');
  });

  it('switches to forgot password flow', async () => {
    render(<UrAuth />);
    
    fireEvent.click(screen.getByText('Forgot password?'));
    
    expect(screen.getAllByText('Reset Password')[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Reset Code' })).toBeInTheDocument();
    
    mockRequestPasswordReset.mockResolvedValueOnce(undefined);
    fireEvent.change(screen.getByPlaceholderText('Enter your email address'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Code' }));
    
    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });

  it('applies custom primary color to primary button', () => {
    render(<UrAuth branding={{ primaryColor: '#4F46E5' }} />);
    const primaryButton = screen.getByRole('button', { name: 'Log In' });
    expect(primaryButton.style.background).toContain('rgb(79, 70, 229)');
  });

  it('applies custom primary color from colors.primaryColor', () => {
    render(<UrAuth colors={{ primaryColor: '#6366f1' }} />);
    const primaryButton = screen.getByRole('button', { name: 'Log In' });
    expect(primaryButton.style.background).toContain('rgb(99, 102, 241)');
  });

  it('hides email/password form when disabled via providers object', () => {
    render(<UrAuth providers={{ emailPassword: false, google: true }} />);
    expect(screen.queryByPlaceholderText('Enter your email address')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Log In' })).not.toBeInTheDocument();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.queryByText('Continue with GitHub')).not.toBeInTheDocument();
  });

  it('only shows GitHub login when configured via providers object', () => {
    render(<UrAuth providers={{ github: true, emailPassword: false }} />);
    expect(screen.queryByPlaceholderText('Enter your email address')).not.toBeInTheDocument();
    expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();
    expect(screen.queryByText('Continue with Google')).not.toBeInTheDocument();
  });

  it('displays message when all authentication methods are disabled', () => {
    render(<UrAuth providers={{ google: false, github: false, emailPassword: false }} />);
    expect(screen.getByText('No authentication methods are enabled for this screen.')).toBeInTheDocument();
  });

  it('supports custom labels and aliases', () => {
    render(<UrAuth labels={{ signInTitle: 'Hello User', signInButton: 'Enter App' }} />);
    expect(screen.getByText('Hello User')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enter App' })).toBeInTheDocument();
  });

  it('supports branding configurations', () => {
    const { container } = render(
      <UrAuth branding={{ appName: 'My Custom App', logo: '/assets/logo.png', subtitle: 'Authentication' }} />
    );
    expect(screen.getByText('My Custom App')).toBeInTheDocument();
    expect(screen.getByText('Authentication')).toBeInTheDocument();
    const logoImg = container.querySelector('img');
    expect(logoImg).toBeInTheDocument();
    expect(logoImg?.getAttribute('src')).toBe('/assets/logo.png');
  });

  it('supports logoUrl branding alias', () => {
    render(
      <UrAuth branding={{ appName: 'My Custom App', logoUrl: '/assets/logo-url.png' }} />
    );
    const logoImg = screen.getByRole('img', { name: 'My Custom App' });
    expect(logoImg).toBeInTheDocument();
    expect(logoImg.getAttribute('src')).toBe('/assets/logo-url.png');
  });
});
