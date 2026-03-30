import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginError, isLoginLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    login(formData, {
      onSuccess: () => navigate('/'),
    });
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
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          
          <Input
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          {loginError && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-500 rounded-lg text-red-500 text-sm">
              {loginError.response?.data?.message || 'Failed to login. Please check your credentials.'}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoginLoading}
          >
            {isLoginLoading ? 'Signing in...' : 'Sign In'}
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
