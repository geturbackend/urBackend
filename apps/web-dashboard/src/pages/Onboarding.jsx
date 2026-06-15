import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../context/OnboardingContext';
import { useAuth } from '../context/AuthContext';
import {
    Rocket,
    Database,
    Key,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const getFirstIncompleteIndex = (steps, progress) => {
    const projectDone = !!progress.create_project;
    const collectionDone = !!progress.create_collection;
    const apiKeyDone = !!progress.get_api_key;
    const apiCallDone = !!progress.make_api_call;

    if (!projectDone) return steps.findIndex((step) => step.key === 'create_project');
    if (!collectionDone) return steps.findIndex((step) => step.key === 'create_collection');
    if (!apiKeyDone) return steps.findIndex((step) => step.key === 'get_api_key');
    if (!apiCallDone) return steps.findIndex((step) => step.key === 'make_api_call');

    return -1;
};

const canAccessStep = (stepKey, progress) => {
    if (stepKey === 'create_project') return true;
    if (stepKey === 'create_collection') return !!progress.create_project;
    if (stepKey === 'get_api_key') return !!progress.create_project && !!progress.create_collection;
    if (stepKey === 'make_api_call') return !!progress.create_project && !!progress.create_collection && !!progress.get_api_key;
    return false;
};

const Onboarding = () => {
    const { steps, progress, activeProjectId } = useOnboarding();
    const { user } = useAuth();
    const navigate = useNavigate();

    const firstIncompleteIndex = useMemo(() => getFirstIncompleteIndex(steps, progress), [steps, progress]);
    const [currentStepIndex, setCurrentStepIndex] = useState(() => (firstIncompleteIndex === -1 ? 0 : firstIncompleteIndex));

    useEffect(() => {
        if (firstIncompleteIndex !== -1) {
            queueMicrotask(() => setCurrentStepIndex(firstIncompleteIndex));
        }
    }, [firstIncompleteIndex]);

    const currentStep = steps[currentStepIndex];
    const isKeyRevealStep = currentStep?.key === 'get_api_key';
    const shouldVerifyForKeys = isKeyRevealStep && !user?.isVerified;
    const canMoveNext = currentStepIndex < steps.length - 1 && currentStep && canAccessStep(steps[currentStepIndex + 1]?.key, progress);

    if (!currentStep) return null;

    const nextStep = () => {
        if (!canMoveNext) return;
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex((prev) => prev + 1);
            return;
        }
        navigate('/dashboard');
    };

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex((prev) => prev - 1);
        }
    };

    const getIcon = (key) => {
        switch (key) {
            case 'create_project':
                return <Rocket size={26} />;
            case 'create_collection':
                return <Database size={26} />;
            case 'get_api_key':
                return <Key size={26} />;
            case 'make_api_call':
                return <BookOpen size={26} />;
            default:
                return <Rocket size={26} />;
        }
    };

    const getWhyText = () => {
        if (currentStepIndex === 0) return 'Your project is the base container for collections, auth, and storage.';
        if (currentStepIndex === 1) return 'Collections define how your data is stored and validated.';
        if (currentStepIndex === 2) return 'Verification keeps live keys and production API traffic protected while still letting you finish setup first.';
        return 'A first API call confirms your project is wired and ready for production flow.';
    };

    const verifyEmailForKeys = () => {
        navigate('/verify-otp', {
            state: {
                email: user?.email,
                from: activeProjectId ? `/project/${activeProjectId}?revealKeys=1` : '/onboarding'
            }
        });
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'var(--color-bg-main)',
                color: 'var(--color-text-main)',
                padding: '2rem',
                paddingTop: '3.5rem'
            }}
        >
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                        Quick Setup
                    </p>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem' }}>Onboarding Timeline</h1>
                    <p style={{ marginTop: '0.45rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        Clean step-by-step setup. No clutter.
                    </p>
                </div>

                <div
                    className="glass-card"
                    style={{
                        borderRadius: '14px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-card)',
                        padding: '1.25rem'
                    }}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(240px,320px)_1fr] gap-4">
                        <div className="lg:border-r lg:pr-4" style={{ borderColor: 'var(--color-border)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                                {steps.map((step, index) => {
                                    const isCompleted = progress[step.key];
                                    const isActive = currentStepIndex === index;
                                    const isLocked = !canAccessStep(step.key, progress);

                                    return (
                                        <button
                                            key={step.key}
                                            onClick={() => {
                                                if (!isLocked) setCurrentStepIndex(index);
                                            }}
                                            disabled={isLocked}
                                            aria-disabled={isLocked}
                                            style={{
                                                width: '100%',
                                                borderRadius: '10px',
                                                border: isActive ? '1px solid rgba(62, 207, 142, 0.45)' : '1px solid var(--color-border)',
                                                background: isActive ? 'rgba(62, 207, 142, 0.08)' : 'var(--color-bg-input)',
                                                color: 'var(--color-text-main)',
                                                textAlign: 'left',
                                                padding: '0.65rem 0.75rem',
                                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                                opacity: isLocked ? 0.55 : 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.6rem'
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: '22px',
                                                    height: '22px',
                                                    borderRadius: '999px',
                                                    border: isCompleted ? '1px solid rgba(62, 207, 142, 0.45)' : '1px solid var(--color-border-hover)',
                                                    background: isCompleted ? 'rgba(62, 207, 142, 0.16)' : 'transparent',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: isCompleted ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                                    flexShrink: 0
                                                }}
                                            >
                                                {isCompleted ? <CheckCircle2 size={14} /> : <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{index + 1}</span>}
                                            </span>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{step.title}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="lg:pl-1" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                                <div
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: 'rgba(62, 207, 142, 0.12)',
                                        color: 'var(--color-primary)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {getIcon(currentStep.key)}
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        Step {currentStepIndex + 1} of {steps.length}
                                    </p>
                                    <h2 style={{ fontSize: '1.35rem', fontWeight: 750 }}>{currentStep.title}</h2>
                                </div>
                            </div>

                            {shouldVerifyForKeys ? (
                                <div style={{ marginTop: '0.8rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 750, marginBottom: '0.45rem' }}>
                                        Your backend is ready.
                                    </h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.55 }}>
                                        To reveal API keys and start making requests, please verify your email.
                                    </p>
                                </div>
                            ) : (
                                <p style={{ marginTop: '0.8rem', fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.55 }}>
                                    {currentStep.description}
                                </p>
                            )}

                            <div
                                style={{
                                    marginTop: '0.85rem',
                                    borderRadius: '10px',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-input)',
                                    padding: '0.75rem'
                                }}
                            >
                                <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Why this matters
                                </p>
                                <p style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--color-text-main)' }}>{getWhyText()}</p>
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <div
                                    style={{
                                        height: '6px',
                                        width: '100%',
                                        borderRadius: '999px',
                                        background: 'var(--color-bg-input)',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
                                            height: '100%',
                                            background: 'var(--color-primary)',
                                            transition: 'width 220ms ease'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                    <button
                                        onClick={prevStep}
                                        disabled={currentStepIndex === 0}
                                        style={{
                                            minWidth: '90px',
                                            height: '38px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-bg-input)',
                                            color: 'var(--color-text-main)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.35rem',
                                            cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer',
                                            opacity: currentStepIndex === 0 ? 0.55 : 1
                                        }}
                                    >
                                        <ChevronLeft size={16} /> Back
                                    </button>

                                    <button
                                        onClick={nextStep}
                                        disabled={!canMoveNext}
                                        style={{
                                            minWidth: '90px',
                                            height: '38px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-bg-input)',
                                            color: 'var(--color-text-main)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.35rem',
                                            cursor: canMoveNext ? 'pointer' : 'not-allowed',
                                            opacity: canMoveNext ? 1 : 0.55
                                        }}
                                    >
                                        Next <ArrowRight size={15} />
                                    </button>
                                </div>

                                <button
                                    onClick={shouldVerifyForKeys ? verifyEmailForKeys : () => navigate(currentStep.path)}
                                    style={{
                                        height: '38px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(62, 207, 142, 0.45)',
                                        background: 'var(--color-primary)',
                                        color: '#0a0a0a',
                                        fontWeight: 700,
                                        fontSize: '0.78rem',
                                        padding: '0 0.9rem',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {shouldVerifyForKeys ? 'Verify Email' : 'Go to step'} <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
