import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// This component takes other components as children
const ProtectedRoute = ({
    children,
    onboardingOnly = false,
    allowIncompleteOnboarding = false,
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

    if (onboardingOnly && onboardingCompleted) {
        return <Navigate to="/dashboard" replace />;
    }

    if (!onboardingOnly && !allowIncompleteOnboarding && !onboardingCompleted) {
        return <Navigate to="/onboarding" replace />;
    }

    // If authenticated, render the child component (e.g., the Dashboard)
    return children;
};

export default ProtectedRoute;
