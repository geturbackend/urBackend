import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
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
