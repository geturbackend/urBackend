import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PUBLIC_API_URL } from '../config';

const PUBLIC_AUTH_STORAGE_KEYS = {
    accessToken: 'urbackend_public_auth_token',
    refreshToken: 'urbackend_public_auth_refresh_token',
    provider: 'urbackend_public_auth_provider',
    projectId: 'urbackend_public_auth_project_id',
    userId: 'urbackend_public_auth_user_id',
};

function AuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        let isActive = true;

        const completeSocialAuth = async () => {
            const fragmentParams = new URLSearchParams(
                window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
            );
            const token = fragmentParams.get('token');
            const rtCode = searchParams.get('rtCode');
            const error = searchParams.get('error');

            if (error) {
                toast.error(error);
                navigate('/login', { replace: true });
                return;
            }

            if (!token || !rtCode) {
                toast.error('Missing auth callback tokens');
                navigate('/login', { replace: true });
                return;
            }

            try {
                const response = await fetch(`${PUBLIC_API_URL}/api/userAuth/social/exchange`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ rtCode, token }),
                });
                const payload = await response.json();

                if (!response.ok || !payload?.success || !payload?.data?.refreshToken) {
                    throw new Error(payload?.message || payload?.error || 'Failed to finalize social auth');
                }

                if (!isActive) return;

                localStorage.setItem(PUBLIC_AUTH_STORAGE_KEYS.accessToken, token);
                localStorage.setItem(PUBLIC_AUTH_STORAGE_KEYS.refreshToken, payload.data.refreshToken);

                const provider = searchParams.get('provider');
                const projectId = searchParams.get('projectId');
                const userId = searchParams.get('userId');

                if (provider) localStorage.setItem(PUBLIC_AUTH_STORAGE_KEYS.provider, provider);
                if (projectId) localStorage.setItem(PUBLIC_AUTH_STORAGE_KEYS.projectId, projectId);
                if (userId) localStorage.setItem(PUBLIC_AUTH_STORAGE_KEYS.userId, userId);

                toast.success('Social auth completed');
                navigate('/dashboard', { replace: true });
            } catch (err) {
                if (!isActive) return;
                toast.error(err.message || 'Failed to finalize social auth');
                navigate('/login', { replace: true });
            }
        };

        completeSocialAuth();

        return () => {
            isActive = false;
        };
    }, [navigate, searchParams]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at top center, #1a1a1a 0%, #000000 100%)',
            color: 'var(--color-text-main)',
            padding: '1rem',
        }}>
            <div className="card" style={{ maxWidth: '440px', width: '100%', textAlign: 'center', padding: '2rem' }}>
                <h2 style={{ marginBottom: '0.75rem' }}>Completing Social Login</h2>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                    Your session is being finalized securely.
                </p>
            </div>
        </div>
    );
}

export default AuthCallback;
