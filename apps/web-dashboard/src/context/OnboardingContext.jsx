/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ONBOARDING_STEPS } from '../constants/onboarding';

const OnboardingContext = createContext(null);

export const OnboardingProvider = ({ children }) => {
    const [progress, setProgress] = useState(() => {
        const saved = localStorage.getItem('onboarding_progress');
        return saved ? JSON.parse(saved) : {};
    });

    const [isDismissed, setIsDismissed] = useState(() => {
        return localStorage.getItem('onboarding_dismissed') === 'true';
    });

    useEffect(() => {
        localStorage.setItem('onboarding_progress', JSON.stringify(progress));
    }, [progress]);

    useEffect(() => {
        localStorage.setItem('onboarding_dismissed', isDismissed.toString());
    }, [isDismissed]);

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
    }, []);

    const allCompleted = ONBOARDING_STEPS.every(step => progress[step.key]);
    const isVisible = !isDismissed && !allCompleted;

    const value = {
        steps: ONBOARDING_STEPS,
        progress,
        completeStep,
        isVisible,
        dismissOnboarding,
        resetOnboarding,
        isDismissed
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
