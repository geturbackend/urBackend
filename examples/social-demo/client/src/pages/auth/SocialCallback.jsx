import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../lib/api';
import { useAuth } from '../../contexts/useAuth';

export default function SocialCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { completeSocialAuth } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const finalize = async () => {
      const token = searchParams.get('token');
      const rtCode = searchParams.get('rtCode');
      const error = searchParams.get('error');

      if (error) {
        setErrorMessage(error);
        setTimeout(() => navigate('/login', { replace: true }), 1200);
        return;
      }

      if (!token || !rtCode) {
        setErrorMessage('Missing social auth callback data.');
        setTimeout(() => navigate('/login', { replace: true }), 1200);
        return;
      }

      try {
        const payload = await authApi.exchangeSocialAuth({ token, rtCode });
        const refreshToken = payload?.data?.refreshToken;

        if (!refreshToken) {
          throw new Error(payload?.message || 'Could not complete social login.');
        }

        if (!active) return;

        await completeSocialAuth({ accessToken: token, refreshToken });
        navigate('/', { replace: true });
      } catch (err) {
        if (!active) return;
        setErrorMessage(err.response?.data?.message || err.message || 'Could not complete social login.');
        setTimeout(() => navigate('/login', { replace: true }), 1200);
      }
    };

    finalize();

    return () => {
      active = false;
    };
  }, [completeSocialAuth, navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 dark:border-gray-800 p-8 text-center">
        <div className="mb-5 flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Completing GitHub sign in</h1>
        <p className="text-gray-500">
          {errorMessage || 'Finishing the secure token exchange and loading your account.'}
        </p>
      </div>
    </div>
  );
}
