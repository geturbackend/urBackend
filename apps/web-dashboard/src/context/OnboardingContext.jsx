/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ONBOARDING_STEPS } from '../constants/onboarding';
import { useAuth } from './AuthContext';

const OnboardingContext = createContext(null);

const safeJsonParse = (value, fallback) => {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
};

export const OnboardingProvider = ({ children }) => {
    const { user } = useAuth();
    const userId = user?._id || 'anonymous';

    const storageKeys = useMemo(() => {
        return {
            progress: `onboarding_progress:${userId}`,
            dismissed: `onboarding_dismissed:${userId}`,
            activeProjectId: `onboarding_active_project_id:${userId}`
        };
    }, [userId]);

    const [progress, setProgress] = useState({});
    const [isDismissed, setIsDismissed] = useState(false);
    const [activeProjectId, setActiveProjectIdState] = useState(null);

    useEffect(() => {
        const savedProgress = localStorage.getItem(storageKeys.progress);
        const savedDismissed = localStorage.getItem(storageKeys.dismissed);
        const savedActiveProjectId = localStorage.getItem(storageKeys.activeProjectId);

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProgress(safeJsonParse(savedProgress, {}));
        setIsDismissed(savedDismissed === 'true');
        setActiveProjectIdState(savedActiveProjectId || null);
    }, [storageKeys]);

    useEffect(() => {
        localStorage.setItem(storageKeys.progress, JSON.stringify(progress));
    }, [progress, storageKeys]);

    useEffect(() => {
        localStorage.setItem(storageKeys.dismissed, isDismissed.toString());
    }, [isDismissed, storageKeys]);

    useEffect(() => {
        if (activeProjectId) localStorage.setItem(storageKeys.activeProjectId, activeProjectId);
        else localStorage.removeItem(storageKeys.activeProjectId);
    }, [activeProjectId, storageKeys]);

    const completeStep = useCallback((stepKey) => {
        setProgress(prev => {
            if (prev[stepKey]) return prev;
            return {
                ...prev,
                [stepKey]: true
            };
        });
    }, []);

    const dismissOnboarding = useCallback(() => {
        setIsDismissed(true);
    }, []);

    const resetOnboarding = useCallback(() => {
        setProgress({});
        setIsDismissed(false);
        setActiveProjectIdState(null);
    }, []);

    const setActiveProjectId = useCallback((projectId) => {
        setActiveProjectIdState(projectId || null);
    }, []);

    const steps = useMemo(() => {
        return ONBOARDING_STEPS.map(step => {
            const path = step.getPath ? step.getPath({ projectId: activeProjectId }) : step.path;
            return { ...step, path };
        });
    }, [activeProjectId]);

    const allCompleted = ONBOARDING_STEPS.every(step => progress[step.key]);
    const isVisible = !isDismissed;

    const value = {
        steps,
        progress,
        completeStep,
        isVisible,
        dismissOnboarding,
        resetOnboarding,
        isDismissed,
        allCompleted,
        activeProjectId,
        setActiveProjectId
    };

    return (
        <OnboardingContext.Provider value={value}>
            {children}
        </OnboardingContext.Provider>
    );
};

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
};
