import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, EyeOff, KeyRound, Lock, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSendOtp = async (event) => {
    if (event) {
      event.preventDefault();
    }

    if (!formData.email) {
      toast.error('Email is required.');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Sending reset code...');

    try {
      const response = await api.post('/api/auth/forgot-password', {
        email: formData.email,
      });

      toast.dismiss(loadingToast);
      toast.success(response.data?.message || 'If this email exists, a reset code has been sent.');
      setStep(2);
    } catch (error) {
      toast.dismiss(loadingToast);
      const data = error.response?.data;
      let message = 'Failed to send reset code.';

      if (data?.message && typeof data.message === 'string') {
        message = data.message;
      } else if (typeof data?.error === 'string' && data.error !== 'Error' && data.error !== 'Internal Server Error') {
        message = data.error;
      } else if (Array.isArray(data?.error)) {
        message = data.error[0]?.message || message;
      }

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (!formData.otp || !formData.newPassword || !formData.confirmPassword) {
      toast.error('OTP and both password fields are required.');
      return;
    }
    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Resetting password...');

    try {
      const response = await api.post('/api/auth/reset-password', {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword,
      });

      toast.dismiss(loadingToast);
      toast.success(response.data?.message || 'Password reset successfully.');
      navigate('/login', {
        replace: true,
        state: { email: formData.email },
      });
    } catch (error) {
      toast.dismiss(loadingToast);
      const data = error.response?.data;
      let message = 'Password reset failed.';

      if (data?.message && typeof data.message === 'string') {
        message = data.message;
      } else if (typeof data?.error === 'string' && data.error !== 'Error' && data.error !== 'Internal Server Error') {
        message = data.error;
      } else if (Array.isArray(data?.error)) {
        message = data.error[0]?.message || message;
      }

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      modeLabel={step === 1 ? 'Forgot password' : 'Reset password'}
      title=""
      subtitle=""
      alternateText="Remembered your password?"
      alternateLabel="Back to sign in"
      alternateTo="/login"
    >
      {step === 1 ? (
        <form className="auth-form" onSubmit={handleSendOtp}>
          <div className="auth-field">
            <label htmlFor="forgot-email">Email address</label>
            <div className="auth-input-wrap">
              <Mail size={18} />
              <input
                id="forgot-email"
                type="email"
                name="email"
                className="input-field auth-input"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send reset code'}
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleResetPassword}>
          <div className="auth-field">
            <label htmlFor="reset-otp">Reset code</label>
            <div className="auth-input-wrap">
              <KeyRound size={18} />
              <input
                id="reset-otp"
                type="text"
                name="otp"
                className="input-field auth-input"
                placeholder="Enter 6-digit code"
                value={formData.otp}
                onChange={handleChange}
                maxLength={6}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="reset-password">New password</label>
            <div className="auth-input-wrap">
              <Lock size={18} />
              <input
                id="reset-password"
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                className="input-field auth-input auth-input--password"
                placeholder="Create a new password"
                value={formData.newPassword}
                onChange={handleChange}
                minLength={6}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="auth-input-toggle"
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowNewPassword((current) => !current)}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="reset-confirm-password">Confirm password</label>
            <div className="auth-input-wrap">
              <Lock size={18} />
              <input
                id="reset-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                className="input-field auth-input auth-input--password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                minLength={6}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="auth-input-toggle"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowConfirmPassword((current) => !current)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Resetting...' : 'Reset password'}
          </button>

          <button
            type="button"
            className="btn btn-secondary auth-submit"
            disabled={isSubmitting}
            onClick={handleSendOtp}
          >
            Resend code
          </button>
        </form>
      )}

      <div className="auth-inline-note">
        <span>Using email:</span>
        <strong>{formData.email || 'Enter your account email'}</strong>
      </div>

      <div className="auth-inline-link">
        <Link to="/login" state={{ email: formData.email }}>
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}

export default ForgotPassword;
