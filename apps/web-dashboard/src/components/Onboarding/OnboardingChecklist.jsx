import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../context/OnboardingContext';
import { Check, ChevronRight, ChevronDown, ChevronUp, X, Rocket, ExternalLink } from 'lucide-react';

const OnboardingChecklist = () => {
    const { steps, progress, isVisible, dismissOnboarding, allCompleted } = useOnboarding();
    const [isExpanded, setIsExpanded] = useState(true);
    const navigate = useNavigate();

    if (!isVisible || allCompleted) return null;

    const totalSteps = steps?.length || 0;
    const completedCount = steps?.filter((step) => progress[step.key]).length || 0;
    const nextIncompleteIndex = steps?.findIndex((step) => !progress[step.key]) ?? -1;

    const rawProgressPercentage = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;
    const progressPercentage = Math.max(0, Math.min(100, rawProgressPercentage));
    const isAllCompleted = totalSteps > 0 && completedCount === totalSteps;

    const goToStep = (path) => {
        if (!path) return;
        navigate(path);
    };

    return (
        <div
            className="glass-card"
            style={{
                padding: '1rem',
                borderRadius: '12px',
                marginBottom: '1.25rem',
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div
                        style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(62, 207, 142, 0.12)',
                            color: 'var(--color-primary)'
                        }}
                    >
                        <Rocket size={16} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.2 }}>Onboarding</h3>
                        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                            {completedCount} of {totalSteps} completed
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                        onClick={() => setIsExpanded((prev) => !prev)}
                        className="btn-icon"
                        title={isExpanded ? 'Collapse onboarding' : 'Expand onboarding'}
                        aria-label={isExpanded ? 'Collapse onboarding' : 'Expand onboarding'}
                    >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                    <button
                        onClick={dismissOnboarding}
                        className="btn-icon"
                        title="Dismiss onboarding"
                        aria-label="Dismiss onboarding"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div style={{ marginTop: '0.85rem' }}>
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
                            width: `${progressPercentage}%`,
                            height: '100%',
                            background: 'var(--color-primary)',
                            transition: 'width 220ms ease'
                        }}
                    />
                </div>
                <p style={{ marginTop: '0.45rem', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    {Math.round(progressPercentage)}% done
                </p>
            </div>

            {!isExpanded && (
                <button
                    onClick={() => setIsExpanded(true)}
                    style={{
                        marginTop: '0.85rem',
                        width: '100%',
                        textAlign: 'left',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-input)',
                        color: 'var(--color-text-main)',
                        padding: '0.6rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                    }}
                >
                    <span style={{ fontSize: '0.8rem' }}>Continue onboarding</span>
                    <ChevronUp size={15} />
                </button>
            )}

            {isExpanded && (
                <div style={{ marginTop: '0.95rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                        {steps.map((step, index) => {
                            const isCompleted = progress[step.key];
                            const isCurrent = index === nextIncompleteIndex;

                            return (
                                <div
                                    key={step.key}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '20px 1fr auto',
                                        gap: '0.6rem',
                                        alignItems: 'start'
                                    }}
                                >
                                    <div style={{ position: 'relative', width: '20px', display: 'flex', justifyContent: 'center' }}>
                                        <div
                                            style={{
                                                width: '16px',
                                                height: '16px',
                                                borderRadius: '999px',
                                                border: isCompleted ? '1px solid rgba(62, 207, 142, 0.5)' : '1px solid var(--color-border-hover)',
                                                background: isCompleted ? 'rgba(62, 207, 142, 0.15)' : isCurrent ? 'rgba(62, 207, 142, 0.08)' : 'transparent',
                                                color: isCompleted ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginTop: '2px'
                                            }}
                                        >
                                            {isCompleted ? <Check size={12} strokeWidth={3} /> : <span style={{ fontSize: '0.6rem', fontWeight: 700 }}>{index + 1}</span>}
                                        </div>
                                        {index < steps.length - 1 && (
                                            <span
                                                aria-hidden="true"
                                                style={{
                                                    position: 'absolute',
                                                    top: '20px',
                                                    width: '1px',
                                                    bottom: '-14px',
                                                    background: 'var(--color-border)'
                                                }}
                                            />
                                        )}
                                    </div>

                                    <button
                                        onClick={() => goToStep(step.path)}
                                        style={{
                                            textAlign: 'left',
                                            borderRadius: '10px',
                                            border: isCurrent ? '1px solid rgba(62, 207, 142, 0.4)' : '1px solid var(--color-border)',
                                            background: isCurrent ? 'rgba(62, 207, 142, 0.06)' : 'var(--color-bg-input)',
                                            padding: '0.6rem 0.7rem',
                                            cursor: 'pointer',
                                            color: 'var(--color-text-main)'
                                        }}
                                    >
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{step.title}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                            {step.description}
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => goToStep(step.path)}
                                        style={{
                                            marginTop: '0.25rem',
                                            width: '34px',
                                            height: '34px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-bg-input)',
                                            color: 'var(--color-text-main)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                        title={`Go to ${step.title}`}
                                        aria-label={`Go to ${step.title}`}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {isAllCompleted && (
                        <div
                            style={{
                                marginTop: '0.95rem',
                                borderRadius: '10px',
                                border: '1px solid rgba(62, 207, 142, 0.35)',
                                background: 'rgba(62, 207, 142, 0.08)',
                                padding: '0.75rem'
                            }}
                        >
                            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Onboarding complete</p>
                            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                You can now manage everything directly from your dashboard.
                            </p>
                        </div>
                    )}

                    <button
                        onClick={() => navigate('/docs')}
                        style={{
                            marginTop: '0.9rem',
                            width: '100%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            border: '1px solid var(--color-border)',
                            background: 'transparent',
                            color: 'var(--color-text-muted)',
                            borderRadius: '8px',
                            fontSize: '0.72rem',
                            padding: '0.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        <ExternalLink size={12} /> Open docs
                    </button>
                </div>
            )}
        </div>
    );
};

export default OnboardingChecklist;
