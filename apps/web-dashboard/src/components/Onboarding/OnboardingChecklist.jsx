import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../context/OnboardingContext';
import { Check, ChevronRight, ChevronDown, ChevronUp, X, Rocket, Sparkles } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

const OnboardingChecklist = () => {
    const { steps, progress, isVisible, dismissOnboarding } = useOnboarding();
    const [isExpanded, setIsExpanded] = useState(true);
    const navigate = useNavigate();

    if (!isVisible) return null;

    const completedCount = steps.filter(s => progress[s.key]).length;
    const progressPercentage = (completedCount / steps.length) * 100;
    const isAllCompleted = completedCount === steps.length;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="fixed bottom-6 right-6 z-[100] flex flex-col items-end"
        >
            <AnimatePresence mode="wait">
                {isExpanded ? (
                    <motion.div
                        key="expanded"
                        initial={{ height: 0, width: 300, opacity: 0 }}
                        animate={{ height: 'auto', width: 340, opacity: 1 }}
                        exit={{ height: 0, width: 0, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="glass-card overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 dark:border-white/5 bg-black/40 backdrop-blur-2xl rounded-2xl mb-2"
                    >
                        {/* Premium Header */}
                        <div className="p-5 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border-b border-white/5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-primary shadow-[0_0_15px_rgba(62,207,142,0.4)] text-black">
                                        <Rocket size={18} fill="currentColor" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm tracking-tight text-white">Getting Started</h3>
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Quick Start Guide</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => setIsExpanded(false)}
                                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                                    >
                                        <ChevronDown size={18} />
                                    </button>
                                    <button 
                                        onClick={dismissOnboarding}
                                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white/60"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Progress Info */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-2xl font-black text-white leading-none">
                                        {Math.round(progressPercentage)}<span className="text-xs font-normal text-white/40 ml-1">%</span>
                                    </span>
                                    <span className="text-[11px] font-bold text-primary/80 uppercase">
                                        {completedCount} of {steps.length} Tasks
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercentage}%` }}
                                        className="h-full bg-gradient-to-r from-primary to-emerald-400 shadow-[0_0_10px_rgba(62,207,142,0.5)]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Steps List */}
                        <div className="p-3 space-y-1.5 max-h-[320px] overflow-y-auto custom-scrollbar">
                            {steps.map((step, index) => {
                                const isCompleted = progress[step.key];
                                const isNext = index === steps.findIndex(s => !progress[s.key]);

                                return (
                                    <motion.div 
                                        key={step.key}
                                        layout
                                        className={`group relative p-3 rounded-xl transition-all duration-300 border ${
                                            isCompleted 
                                            ? 'bg-white/[0.02] border-transparent opacity-50' 
                                            : isNext 
                                                ? 'bg-white/[0.05] border-white/10 shadow-lg shadow-black/20' 
                                                : 'bg-transparent border-transparent opacity-70'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-500 ${
                                                isCompleted 
                                                ? 'bg-primary/20 text-primary scale-90' 
                                                : isNext 
                                                    ? 'bg-primary text-black shadow-[0_0_10px_rgba(62,207,142,0.3)]' 
                                                    : 'bg-white/10 text-white/30'
                                            }`}>
                                                {isCompleted ? <Check size={14} strokeWidth={4} /> : <span className="text-xs font-bold">{index + 1}</span>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`text-sm font-semibold transition-all ${isCompleted ? 'line-through text-white/30' : 'text-white'}`}>
                                                    {step.title}
                                                </h4>
                                                {isNext && !isAllCompleted && (
                                                    <p className="text-[11px] text-white/50 mt-1 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-500">
                                                        {step.description}
                                                    </p>
                                                )}
                                            </div>
                                            {isNext && !isAllCompleted && (
                                                <button 
                                                    onClick={() => navigate(step.path)}
                                                    className="self-center p-2 rounded-lg bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-black hover:scale-110 active:scale-95"
                                                >
                                                    <ChevronRight size={14} strokeWidth={3} />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {isAllCompleted && (
                                <motion.div 
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="p-4 text-center bg-primary/10 rounded-xl border border-primary/20"
                                >
                                    <div className="inline-flex p-2 rounded-full bg-primary/20 text-primary mb-2">
                                        <Sparkles size={20} />
                                    </div>
                                    <p className="text-sm font-bold text-white mb-1">Project is ready!</p>
                                    <p className="text-[10px] text-white/40 mb-3 uppercase tracking-tighter">You've mastered the basics</p>
                                    <button 
                                        onClick={dismissOnboarding}
                                        className="w-full py-2 rounded-lg bg-primary text-black text-xs font-bold hover:bg-white transition-colors uppercase tracking-widest"
                                    >
                                        Enter Dashboard
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        key="collapsed"
                        layoutId="checklist-container"
                        onClick={() => setIsExpanded(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-3 p-3 bg-primary text-black rounded-2xl shadow-[0_10px_30px_rgba(62,207,142,0.3)] font-bold text-sm"
                    >
                        <div className="relative">
                            <Rocket size={18} fill="currentColor" />
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-primary animate-pulse" />
                        </div>
                        <span>Onboarding ({completedCount}/{steps.length})</span>
                        <ChevronUp size={18} />
                    </motion.button>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
                .animate-bounce-slow { animation: bounce 3s infinite; }
                @keyframes bounce { 0%, 100% { transform: translateY(-5%); } 50% { transform: translateY(0); } }
            `}</style>
        </motion.div>
    );
};

export default OnboardingChecklist;

