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
    
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Reset Code' })).toBeInTheDocument();
    
    mockRequestPasswordReset.mockResolvedValueOnce(undefined);
    fireEvent.change(screen.getByPlaceholderText('Enter your email address'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Code' }));
    
    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });
});
