import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../context/OnboardingContext';
import { FiCheck, FiChevronRight, FiChevronDown, FiChevronUp, FiX, FiRocket } from 'react-icons/fi';

const OnboardingChecklist = () => {
    const { steps, progress, isVisible, dismissOnboarding } = useOnboarding();
    const [isExpanded, setIsExpanded] = useState(true);
    const navigate = useNavigate();

    if (!isVisible) return null;

    const completedCount = steps.filter(s => progress[s.key]).length;
    const progressPercentage = (completedCount / steps.length) * 100;
    const isAllCompleted = completedCount === steps.length;

    return (
        <div className={`fixed bottom-6 right-6 z-[100] transition-all duration-300 ${isExpanded ? 'w-80' : 'w-auto'}`}>
            <div className="glass-card overflow-hidden shadow-2xl border border-white/10 dark:border-white/5 animate-fade-in-up">
                {/* Header */}
                <div 
                    className="p-4 flex items-center justify-between cursor-pointer bg-gradient-to-r from-primary/20 to-transparent"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/20 text-primary">
                            <FiRocket size={18} />
                        </div>
                        <span className="font-semibold text-sm">Getting Started</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white/50">{completedCount}/{steps.length}</span>
                        <button 
                            className="p-1 hover:bg-white/10 rounded-md transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                        >
                            {isExpanded ? <FiChevronDown /> : <FiChevronUp />}
                        </button>
                        <button 
                            className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/30 hover:text-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                dismissOnboarding();
                            }}
                        >
                            <FiX size={16} />
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1 w-full bg-white/5">
                    <div 
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>

                {/* Steps List */}
                {isExpanded && (
                    <div className="p-2 space-y-1 bg-black/20 backdrop-blur-sm">
                        {steps.map((step, index) => {
                            const isCompleted = progress[step.key];
                            const isNext = index === steps.findIndex(s => !progress[s.key]);

                            return (
                                <div 
                                    key={step.key}
                                    className={`group p-3 rounded-xl transition-all duration-200 ${
                                        isCompleted ? 'opacity-60' : isNext ? 'bg-white/5' : 'opacity-80'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                                            isCompleted 
                                            ? 'bg-success border-success text-white' 
                                            : isNext ? 'border-primary text-primary' : 'border-white/20'
                                        }`}>
                                            {isCompleted ? <FiCheck size={12} strokeWidth={3} /> : <span className="text-[10px] font-bold">{index + 1}</span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-sm font-medium transition-colors ${isCompleted ? 'line-through text-white/40' : 'text-white'}`}>
                                                {step.title}
                                            </h4>
                                            {isNext && !isAllCompleted && (
                                                <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">
                                                    {step.description}
                                                </p>
                                            )}
                                        </div>
                                        {isNext && !isAllCompleted && (
                                            <button 
                                                onClick={() => navigate(step.path)}
                                                className="self-center p-1.5 rounded-lg bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white"
                                            >
                                                <FiChevronRight size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {isAllCompleted && (
                            <div className="p-4 text-center animate-bounce-slow">
                                <p className="text-sm font-semibold text-primary">🎉 You're all set!</p>
                                <button 
                                    onClick={dismissOnboarding}
                                    className="mt-2 text-xs text-white/50 hover:text-white underline"
                                >
                                    Hide checklist
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnboardingChecklist;
