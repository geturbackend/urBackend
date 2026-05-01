import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../context/OnboardingContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Rocket, Database, Key, BookOpen, CheckCircle2, 
    ArrowRight, ChevronLeft, ChevronRight, Sparkles, X 
} from 'lucide-react';
import { useState } from 'react';

void motion;

const Onboarding = () => {
    const { steps, progress } = useOnboarding();
    const navigate = useNavigate();

    const firstIncompleteIndex = steps.findIndex(step => !progress[step.key]);
    const [currentStepIndex, setCurrentStepIndex] = useState(() => (firstIncompleteIndex === -1 ? 0 : firstIncompleteIndex));

    const currentStep = steps[currentStepIndex];

    if (!currentStep) return null;

    const nextStep = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            navigate('/dashboard');
        }
    };

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const getIcon = (key) => {
        switch (key) {
            case 'create_project': return <Rocket size={48} />;
            case 'create_collection': return <Database size={48} />;
            case 'get_api_key': return <Key size={48} />;
            case 'make_api_call': return <BookOpen size={48} />;
            default: return <Rocket size={48} />;
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 overflow-hidden relative">
            {/* Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] animate-pulse delay-700" />

            <div className="max-w-4xl w-full z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6"
                    >
                        <Sparkles size={14} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Welcome to urBackend</span>
                    </motion.div>
                    <h1 className="text-5xl font-black mb-4 tracking-tighter">
                        Let's get you <span className="text-primary">started.</span>
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                        Follow these simple steps to launch your backend in record time.
                    </p>
                </div>

                {/* Main Stepper Card */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
                    {/* Sidebar Steps */}
                    <div className="md:col-span-4 space-y-3">
                        {steps.map((step, index) => (
                            <button
                                key={step.key}
                                onClick={() => setCurrentStepIndex(index)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${
                                    currentStepIndex === index 
                                    ? 'bg-white/10 border-white/20 shadow-xl' 
                                    : 'bg-transparent border-transparent opacity-40 hover:opacity-100 hover:bg-white/5'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                    progress[step.key] 
                                    ? 'bg-primary text-black' 
                                    : currentStepIndex === index ? 'bg-white text-black' : 'bg-white/10 text-white'
                                }`}>
                                    {progress[step.key] ? <CheckCircle2 size={16} /> : index + 1}
                                </div>
                                <span className={`text-sm font-bold ${currentStepIndex === index ? 'text-white' : 'text-zinc-500'}`}>
                                    {step.title}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="md:col-span-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep.key}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 h-full flex flex-col shadow-2xl"
                            >
                                <div className="flex-1">
                                    <div className="p-5 rounded-3xl bg-primary/10 text-primary inline-flex mb-8 shadow-inner ring-1 ring-primary/20">
                                        {getIcon(currentStep.key)}
                                    </div>
                                    <h2 className="text-3xl font-black mb-4 tracking-tight">{currentStep.title}</h2>
                                    <p className="text-zinc-400 text-lg leading-relaxed mb-8">
                                        {currentStep.description}
                                    </p>
                                    
                                    <div className="bg-black/40 rounded-2xl p-6 border border-white/5">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                                            <ArrowRight size={12} className="text-primary" /> Why this matters
                                        </h4>
                                        <p className="text-sm text-zinc-300 italic">
                                            {currentStepIndex === 0 && "Your project is the root container for all your collections, auth rules, and storage buckets."}
                                            {currentStepIndex === 1 && "Collections are like database tables. They define how your data is structured and validated."}
                                            {currentStepIndex === 2 && "The API key allows your frontend application to securely communicate with urBackend."}
                                            {currentStepIndex === 3 && "Start fetching and storing data in your app using our simplified REST endpoints."}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-12 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={prevStep}
                                            disabled={currentStepIndex === 0}
                                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                                                currentStepIndex === 0 ? 'opacity-0 pointer-events-none' : 'hover:bg-white/5 text-zinc-400 hover:text-white'
                                            }`}
                                        >
                                            <ChevronLeft size={18} /> Back
                                        </button>

                                        <button 
                                            onClick={nextStep}
                                            className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest px-4 py-2"
                                        >
                                            Next
                                        </button>
                                    </div>

                                    <button 
                                        onClick={() => navigate(currentStep.path)}
                                        className="bg-primary text-black px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-white transition-all shadow-lg shadow-primary/20 active:scale-95"
                                    >
                                        Go to {currentStep.title} <ChevronRight size={18} strokeWidth={3} />
                                    </button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Progress Bar Bottom */}
                <div className="mt-12 w-full flex items-center gap-6">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                            className="h-full bg-primary shadow-[0_0_15px_rgba(62,207,142,0.5)]"
                        />
                    </div>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                        Step {currentStepIndex + 1} of {steps.length}
                    </span>
                </div>
            </div>

            {/* Close / Skip */}
            <button 
                onClick={() => navigate('/dashboard')}
                className="absolute top-8 right-8 p-3 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white transition-all"
            >
                <X size={24} />
            </button>
        </div>
    );
};

export default Onboarding;
