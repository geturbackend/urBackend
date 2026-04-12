import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Github, Lock, Mail, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { API_URL } from '../config';

function Signup() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const passwordChecks = useMemo(
    () => [
      {
        label: 'At least 6 characters',
        passed: formData.password.length >= 6,
      },
      {
        label: 'Contains a letter',
        passed: /[A-Za-z]/.test(formData.password),
      },
      {
        label: 'Contains a number',
        passed: /\d/.test(formData.password),
      },
    ],
    [formData.password]
  );

  if (authLoading) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Creating your account...');

    try {
      const response = await api.post('/api/auth/register', formData);

      toast.dismiss(loadingToast);
      toast.success(response.data.message);
      navigate('/verify-otp', { state: { email: formData.email } });
    } catch (error) {
      toast.dismiss(loadingToast);

      const data = error.response?.data;
      let errorMessage = 'Signup failed. Please try again.';

      if (typeof data?.error === 'string') {
        errorMessage = data.error;
      } else if (Array.isArray(data?.error)) {
        errorMessage = data.error[0]?.message || 'Validation failed.';
      } else if (data?.error) {
        errorMessage = JSON.stringify(data.error);
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGithubSignIn = () => {
    window.location.assign(`${API_URL}/api/auth/github/start`);
  };

  return (
    <AuthShell
      modeLabel="Create account"
      title=""
      subtitle=""
      alternateText="Already have access?"
      alternateLabel="Sign in instead"
      alternateTo="/login"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <button
          type="button"
          className="btn btn-secondary auth-submit"
          onClick={handleGithubSignIn}
          disabled={isSubmitting}
        >
          <Github size={17} />
          Continue with GitHub
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-field">
          <label htmlFor="signup-name">Full name</label>
          <div className="auth-input-wrap">
            <UserRound size={18} />
            <input
              id="signup-name"
              type="text"
              name="name"
              className="input-field auth-input"
              placeholder="Jane Doe"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
            />
          </div>
          <p className="auth-field__hint">Optional</p>
        </div>

        <div className="auth-field">
          <label htmlFor="signup-email">Work email</label>
          <div className="auth-input-wrap">
            <Mail size={18} />
            <input
              id="signup-email"
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

        <div className="auth-field">
          <label htmlFor="signup-password">Password</label>
          <div className="auth-input-wrap">
            <Lock size={18} />
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              className="input-field auth-input auth-input--password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={6}
              required
            />
            <button
              type="button"
              className="auth-input-toggle"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="auth-password-checks">
          {passwordChecks.map((check) => (
            <div
              key={check.label}
              className={`auth-password-check ${check.passed ? 'is-passed' : ''}`}
            >
              <span className="auth-password-check__dot" />
              <span>{check.label}</span>
            </div>
          ))}
        </div>

        <button type="submit" className="btn btn-primary auth-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}

export default Signup;
