import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// This component takes other components as children
const ProtectedRoute = ({
    children,
    allowUnverified = true
}) => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: 'var(--color-bg-main)',
                color: 'var(--color-text-main)'
            }}>
                <div className="loader">Loading Session...</div>
            </div>
        );
    }

    // If not authenticated, redirect to login page
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!allowUnverified && !user?.isVerified) {
        return <Navigate to="/verify-otp" replace state={{ email: user?.email, from: location.pathname }} />;
    }

    const onboardingCompleted = !!user?.onboarding?.completed;

    if (onboardingCompleted) {
        if (location.pathname.startsWith('/onboarding')) {
            return <Navigate to="/dashboard" replace />;
        }
    } else {
        const steps = user?.onboarding?.steps || {};
        
        // If accessing a dashboard/post-onboarding page, or exactly /onboarding, redirect to the correct step
        if (!location.pathname.startsWith('/onboarding') || location.pathname === '/onboarding' || location.pathname === '/onboarding/') {
            if (!steps.projectCreated) {
                return <Navigate to="/onboarding/project" replace />;
            } else if (!steps.collectionCreated) {
                return <Navigate to="/onboarding/collection" replace />;
            } else {
                return <Navigate to="/onboarding/api" replace />;
            }
        }
        
        // If on /onboarding/*, enforce step prerequisites strictly
        if (!steps.projectCreated) {
            if (location.pathname !== '/onboarding/project') {
                return <Navigate to="/onboarding/project" replace />;
            }
        } else if (!steps.collectionCreated) {
            if (location.pathname !== '/onboarding/collection') {
                return <Navigate to="/onboarding/collection" replace />;
            }
        } else {
            if (location.pathname !== '/onboarding/api') {
                return <Navigate to="/onboarding/api" replace />;
            }
        }
    }

    return children;
};

export default ProtectedRoute;
