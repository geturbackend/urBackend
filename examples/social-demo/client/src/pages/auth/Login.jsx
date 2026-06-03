import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { authApi } from '../../lib/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginError, isLoginLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [lockoutSecondsRemaining, setLockoutSecondsRemaining] = useState(0);
  const [lockedEmail, setLockedEmail] = useState('');

  /**
   * Normalizes an email address for stable lockout comparison.
   * @param {string} value - Raw email input value.
   * @returns {string} Normalized email.
   */
  const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

  /**
   * Extracts the retry window in seconds from a lockout API error.
   * @param {Error & { response?: { data?: object, headers?: object } }} error - Axios error.
   * @returns {number} Retry delay in seconds.
   */
  const parseRetryAfterSeconds = (error) => {
    const payload = error?.response?.data || {};

    const retryAfterFromBody = Number(payload?.retryAfterSeconds);
    if (Number.isFinite(retryAfterFromBody) && retryAfterFromBody > 0) {
      return Math.floor(retryAfterFromBody);
    }

    const retryAfterHeader = Number(error?.response?.headers?.['retry-after']);
    if (Number.isFinite(retryAfterHeader) && retryAfterHeader > 0) {
      return Math.floor(retryAfterHeader);
    }

    const message = String(payload?.message || payload?.error || '');
    const secondsMatch = message.match(/(\d+)\s*seconds?/i);
    if (secondsMatch) {
      return Number(secondsMatch[1]);
    }

    return 60;
  };

  useEffect(() => {
    if (lockoutSecondsRemaining <= 0) return undefined;

    const timer = window.setInterval(() => {
      setLockoutSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [lockoutSecondsRemaining]);

  const isLockoutActive = useMemo(() => {
    return (
      lockoutSecondsRemaining > 0 &&
      normalizeEmail(formData.email) !== '' &&
      normalizeEmail(formData.email) === lockedEmail
    );
  }, [formData.email, lockoutSecondsRemaining, lockedEmail]);

  /**
   * Updates the email field in the login form.
   * @param {React.ChangeEvent<HTMLInputElement>} e - Email input change event.
   */
  const handleEmailChange = (e) => {
    setFormData((current) => ({ ...current, email: e.target.value }));
  };

  /**
   * Updates the password field in the login form.
   * @param {React.ChangeEvent<HTMLInputElement>} e - Password input change event.
   */
  const handlePasswordChange = (e) => {
    setFormData((current) => ({ ...current, password: e.target.value }));
  };

  /**
   * Navigates to the dashboard after a successful login mutation.
   */
  const handleLoginSuccess = () => {
    navigate('/');
  };

  /**
   * Submits the login form and forwards successful sign-ins to the home page.
   * @param {React.FormEvent<HTMLFormElement>} e - Form submit event.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLockoutActive) return;

    login(formData, {
      onSuccess: handleLoginSuccess,
      onError: (error) => {
        if (error?.response?.status === 423) {
          const seconds = parseRetryAfterSeconds(error);
          setLockedEmail(normalizeEmail(formData.email));
          setLockoutSecondsRemaining(seconds);
        }
      },
    });
  };

  const handleGithubLogin = () => {
    const startUrl = authApi.getSocialStartUrl('github');
    window.location.href = startUrl;
  };

  const handleGoogleLogin = () => {
    const startUrl = authApi.getSocialStartUrl('google');
    window.location.href = startUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <svg viewBox="0 0 24 24" className="w-12 h-12 mx-auto text-primary fill-current mb-4">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-gray-500">Sign in to continue to X</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleEmailChange}
            required
          />
          
          <Input
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handlePasswordChange}
            required
          />

          {isLockoutActive && (
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-500 rounded-lg text-yellow-700 dark:text-yellow-300 text-sm">
              Too many failed attempts. Try again in {lockoutSecondsRemaining} seconds.
            </div>
          )}

          {loginError && !isLockoutActive && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-500 rounded-lg text-red-500 text-sm">
              {loginError.response?.data?.message || 'Failed to login. Please check your credentials.'}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoginLoading || isLockoutActive}
          >
            {isLoginLoading ? 'Signing in...' : isLockoutActive ? `Locked (${lockoutSecondsRemaining}s)` : 'Sign In'}
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-[0.24em] text-gray-400">
              <span className="bg-white px-3 dark:bg-black">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full flex items-center justify-center gap-3"
            size="lg"
            onClick={handleGithubLogin}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.38 7.86 10.9.58.1.79-.25.79-.56 0-.28-.01-1.2-.02-2.18-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.35.96.1-.75.4-1.26.72-1.55-2.56-.29-5.26-1.28-5.26-5.72 0-1.27.45-2.31 1.19-3.13-.12-.29-.52-1.47.11-3.07 0 0 .98-.31 3.2 1.19.93-.26 1.93-.39 2.92-.39s1.99.13 2.92.39c2.22-1.5 3.2-1.19 3.2-1.19.63 1.6.23 2.78.11 3.07.74.82 1.19 1.86 1.19 3.13 0 4.45-2.7 5.42-5.27 5.7.41.36.78 1.08.78 2.18 0 1.58-.01 2.85-.01 3.24 0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
            </svg>
            Continue with GitHub
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="w-full flex items-center justify-center gap-3"
            size="lg"
            onClick={handleGoogleLogin}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 2.9 14.7 2 12 2 6.9 2 2.8 6.3 2.8 11.8S6.9 21.5 12 21.5c6.9 0 8.6-5 8.6-7.6 0-.5 0-.9-.1-1.2H12Z" />
              <path fill="#34A853" d="M3.8 7.1 7 9.5C7.8 7.8 9.7 6.6 12 6.6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 2.9 14.7 2 12 2 8.4 2 5.3 4.1 3.8 7.1Z" />
              <path fill="#FBBC05" d="M12 21.5c2.6 0 4.8-.9 6.4-2.5l-3.1-2.5c-.8.6-1.9 1.1-3.3 1.1-3.9 0-5.2-2.6-5.5-3.8l-3.2 2.5c1.5 3.1 4.6 5.2 8.7 5.2Z" />
              <path fill="#4285F4" d="M20.6 13.9c0-.5 0-.9-.1-1.2H12v3.9h5.5c-.3 1.1-1.1 2-2.2 2.6l3.1 2.5c1.8-1.7 2.8-4.2 2.8-7.8Z" />
            </svg>
            Continue with Google
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center text-gray-500">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:underline font-semibold">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
