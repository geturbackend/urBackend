import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { authApi } from '../../lib/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, signupError, isSignupLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    displayName: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Add default values for fields that might be required in urBackend
    const signupData = {
      ...formData,
      verified: false,
      followersCount: 0,
      followingCount: 0,
    };
    signup(signupData, {
      onSuccess: () => navigate('/'),
    });
  };

  const handleGithubLogin = () => {
    const startUrl = authApi.getSocialStartUrl('github');
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
          <h1 className="text-3xl font-bold mb-2">Join X Today</h1>
          <p className="text-gray-500">Create your account</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            label="Username"
            placeholder="Choose a username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
            required
          />

          <Input
            type="text"
            label="Display Name"
            placeholder="Your display name"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            required
          />
          
          <Input
            type="email"
            label="Email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          
          <Input
            type="password"
            label="Password"
            placeholder="Create a password (min 6 characters)"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={6}
          />

          {signupError && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-500 rounded-lg text-red-500 text-sm">
              {signupError.response?.data?.message || 'Failed to create account. Please try again.'}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSignupLoading}
          >
            {isSignupLoading ? 'Creating account...' : 'Sign Up'}
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
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
