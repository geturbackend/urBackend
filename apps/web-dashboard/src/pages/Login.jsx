import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Github, Mail } from 'lucide-react';

import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { API_URL } from '../config';

function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');

    if (!error) {
      return;
    }

    toast.error(error);
    navigate(
      {
        pathname: location.pathname,
      },
      { replace: true }
    );
  }, [location.pathname, location.search, navigate]);

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

    setIsLoading(true);
    const loadingToast = toast.loading('Signing you in...');

    try {
      const response = await api.post('/api/auth/login', formData);

      if (response.data.success) {
        login(response.data.user);
        toast.dismiss(loadingToast);
        toast.success('Welcome back.');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.dismiss(loadingToast);

      const data = error.response?.data;
      let errorMessage = 'Login failed. Check your credentials and try again.';

      if (typeof data?.error === 'string') {
        errorMessage = data.error;
      } else if (Array.isArray(data?.error)) {
        errorMessage = data.error[0]?.message || 'Validation failed.';
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubSignIn = () => {
    window.location.assign(`${API_URL}/api/auth/github/start`);
  };

  return (
    <AuthShell
      modeLabel="Sign in"
      title=""
      subtitle=""
      alternateText="New to urBackend?"
      alternateLabel="Create an account"
      alternateTo="/signup"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <button
          type="button"
          className="btn btn-secondary auth-submit"
          onClick={handleGithubSignIn}
          disabled={isLoading}
        >
          <Github size={17} />
          Continue with GitHub
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-field">
          <label htmlFor="login-email">Email address</label>
          <div className="auth-input-wrap">
            <Mail size={18} />
            <input
              id="login-email"
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
          <div className="auth-field__row">
            <label htmlFor="login-password">Password</label>
            <Link to="/forgot-password" state={{ email: formData.email }} className="auth-text-link">
              Forgot password?
            </Link>
          </div>
          <div className="auth-input-wrap">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              className="input-field auth-input auth-input--password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
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

        <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}

export default Login;
