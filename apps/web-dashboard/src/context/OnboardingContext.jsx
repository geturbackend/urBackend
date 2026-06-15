/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ONBOARDING_STEPS } from '../constants/onboarding';
import { useAuth } from './AuthContext';
import api from '../utils/api';

const OnboardingContext = createContext(null);

const SERVER_STEP_BY_UI_STEP = {
    create_project: 'projectCreated',
    create_collection: 'collectionCreated',
    make_api_call: 'firstApiCall'
};

const getServerProgress = (user) => {
    const steps = user?.onboarding?.steps || {};
    return {
        create_project: Boolean(steps.projectCreated),
        create_collection: Boolean(steps.collectionCreated),
        get_api_key: Boolean(user?.isVerified),
        make_api_call: Boolean(steps.firstApiCall),
        currentStep: user?.onboarding?.currentStep || 'project',
        projectId: user?.onboarding?.projectId || null,
        collectionId: user?.onboarding?.collectionId || null
    };
};

export const OnboardingProvider = ({ children }) => {
    const { user, updateUser } = useAuth();
    const userId = user?._id || 'anonymous';

    const storageKeys = useMemo(() => {
        return {
            dismissed: `onboarding_dismissed:${userId}`,
            activeProjectId: `onboarding_active_project_id:${userId}`
        };
    }, [userId]);

    const [progress, setProgress] = useState({});
    const [isDismissed, setIsDismissed] = useState(false);
    const [activeProjectId, setActiveProjectIdState] = useState(null);

    useEffect(() => {
        const savedDismissed = localStorage.getItem(storageKeys.dismissed);
        const savedActiveProjectId = localStorage.getItem(storageKeys.activeProjectId);

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProgress(getServerProgress(user));
        setIsDismissed(savedDismissed === 'true');
        setActiveProjectIdState(savedActiveProjectId || null);
    }, [storageKeys, user]);

    useEffect(() => {
        localStorage.setItem(storageKeys.dismissed, isDismissed.toString());
    }, [isDismissed, storageKeys]);

    useEffect(() => {
        if (activeProjectId) localStorage.setItem(storageKeys.activeProjectId, activeProjectId);
        else localStorage.removeItem(storageKeys.activeProjectId);
    }, [activeProjectId, storageKeys]);

    const completeStep = useCallback((stepKey, meta = {}) => {
        const serverStep = SERVER_STEP_BY_UI_STEP[stepKey];
        if (!serverStep) return;

        api.patch('/api/user/onboarding', {
            steps: { [serverStep]: true },
            ...meta
        })
            .then((response) => {
                const onboarding = response.data?.data?.onboarding;
                if (!onboarding) return;
                setProgress(getServerProgress({ onboarding }));
                updateUser((currentUser) => ({
                    ...currentUser,
                    onboarding
                }));
            })
            .catch((err) => {
                console.error('[onboarding] Failed to persist progress:', err.message);
            });
    }, [updateUser]);

    const refreshUser = useCallback(async () => {
        try {
            const response = await api.get('/api/auth/me');
            if (response.data.success) {
                updateUser(response.data.data.user);
            }
        } catch (err) {
            console.error("Failed to refresh user:", err.message);
        }
    }, [updateUser]);

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

    const allCompleted = !!user?.onboarding?.completed;
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
        setActiveProjectId,
        refreshUser,
        currentStep: progress.currentStep,
        projectId: progress.projectId,
        collectionId: progress.collectionId
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
