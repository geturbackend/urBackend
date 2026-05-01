import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../context/OnboardingContext';
import { Check, ChevronRight, ChevronDown, ChevronUp, X, Rocket, Sparkles, ExternalLink } from 'lucide-react';
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
                        initial={{ height: 0, width: 320, opacity: 0 }}
                        animate={{ height: 'auto', width: 360, opacity: 1 }}
                        exit={{ height: 0, width: 0, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="glass-card overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-white/10 bg-zinc-900/80 backdrop-blur-3xl rounded-3xl mb-3"
                    >
                        {/* Premium Header */}
                        <div className="p-6 bg-gradient-to-br from-primary/15 via-transparent to-transparent border-b border-white/5">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-primary shadow-[0_0_20px_rgba(62,207,142,0.3)] text-black">
                                        <Rocket size={20} fill="currentColor" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base tracking-tight text-white">Getting Started</h3>
                                        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">Mission Control</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setIsExpanded(false)}
                                        className="p-1.5 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white"
                                        title="Minimize"
                                    >
                                        <ChevronDown size={18} />
                                    </button>
                                    <button 
                                        onClick={dismissOnboarding}
                                        className="p-1.5 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-red-400"
                                        title="Dismiss Forever"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Progress Info */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-3xl font-black text-white leading-none">
                                        {Math.round(progressPercentage)}<span className="text-sm font-normal text-white/30 ml-1">%</span>
                                    </span>
                                    <div className="text-right">
                                        <span className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-0.5">Progress</span>
                                        <span className="text-xs font-bold text-primary italic">
                                            {completedCount} of {steps.length} Steps
                                        </span>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[2px]">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercentage}%` }}
                                        className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 shadow-[0_0_15px_rgba(62,207,142,0.4)]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Steps List */}
                        <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {steps.map((step, index) => {
                                const isCompleted = progress[step.key];
                                const isNext = index === steps.findIndex(s => !progress[s.key]);

                                return (
                                    <motion.div 
                                        key={step.key}
                                        layout
                                        className={`group relative p-4 rounded-2xl transition-all duration-500 border ${
                                            isCompleted 
                                            ? 'bg-white/[0.02] border-transparent opacity-40' 
                                            : isNext 
                                                ? 'bg-white/[0.07] border-white/10 shadow-xl shadow-black/40 ring-1 ring-primary/20' 
                                                : 'bg-transparent border-transparent opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-700 ${
                                                isCompleted 
                                                ? 'bg-primary/20 text-primary' 
                                                : isNext 
                                                    ? 'bg-primary text-black shadow-[0_0_15px_rgba(62,207,142,0.4)] scale-110' 
                                                    : 'bg-white/10 text-white/20'
                                            }`}>
                                                {isCompleted ? <Check size={16} strokeWidth={4} /> : <span className="text-xs font-black">{index + 1}</span>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`text-sm font-bold transition-all ${isCompleted ? 'text-white/40' : 'text-white'}`}>
                                                    {step.title}
                                                </h4>
                                                {isNext && !isAllCompleted && (
                                                    <p className="text-[11px] text-white/50 mt-1.5 leading-relaxed font-medium">
                                                        {step.description}
                                                    </p>
                                                )}
                                            </div>
                                            {isNext && !isAllCompleted && (
                                                <button 
                                                    onClick={() => navigate(step.path)}
                                                    className="self-center p-2 rounded-xl bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-black hover:scale-110 active:scale-90"
                                                >
                                                    <ChevronRight size={16} strokeWidth={3} />
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
                                    className="p-6 text-center bg-primary/10 rounded-2xl border border-primary/20 backdrop-blur-md"
                                >
                                    <div className="inline-flex p-3 rounded-2xl bg-primary/20 text-primary mb-3 shadow-[0_0_20px_rgba(62,207,142,0.2)]">
                                        <Sparkles size={24} />
                                    </div>
                                    <p className="text-base font-black text-white mb-1">You're a Pro now!</p>
                                    <p className="text-[10px] text-white/30 mb-4 uppercase tracking-[0.3em] font-bold">Setup Complete</p>
                                    <button 
                                        onClick={dismissOnboarding}
                                        className="w-full py-3 rounded-xl bg-primary text-black text-xs font-black hover:bg-white transition-all uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95"
                                    >
                                        Go to Dashboard
                                    </button>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer Link */}
                        <div className="p-4 bg-white/[0.02] border-t border-white/5 flex justify-center">
                             <button 
                                onClick={() => navigate('/docs')}
                                className="text-[10px] font-bold text-white/20 hover:text-primary transition-colors flex items-center gap-1.5 uppercase tracking-widest"
                             >
                                <ExternalLink size={10} /> Full Guide
                             </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        key="collapsed"
                        layoutId="checklist-container"
                        onClick={() => setIsExpanded(true)}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-3 p-4 bg-primary text-black rounded-2xl shadow-[0_15px_40px_rgba(62,207,142,0.3)] font-black text-xs uppercase tracking-widest border-2 border-white/20"
                    >
                        <div className="relative">
                            <Rocket size={18} fill="currentColor" />
                            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-primary animate-ping" />
                            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-primary" />
                        </div>
                        <span className="hidden sm:inline">Onboarding Progress</span>
                        <div className="bg-black/20 px-2 py-0.5 rounded-lg">
                            {completedCount}/{steps.length}
                        </div>
                        <ChevronUp size={18} />
                    </motion.button>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
            `}</style>
        </motion.div>
    );
};

export default OnboardingChecklist;
