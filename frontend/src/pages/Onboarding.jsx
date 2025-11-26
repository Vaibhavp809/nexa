import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Bot, MessageSquare, FileText, Languages, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

const steps = [
    {
        id: 1,
        title: 'Welcome to Nexa',
        description: 'Your intelligent AI assistant for productivity',
        icon: Bot,
        content: (
            <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Bot className="text-white" size={48} />
                </div>
                <p className="text-gray-300 text-lg max-w-md mx-auto">
                    Nexa helps you chat, summarize, translate, and take notes seamlessly. Let's get you started!
                </p>
            </div>
        )
    },
    {
        id: 2,
        title: 'Floating Bubble',
        description: 'Your AI companion is always accessible',
        icon: Bot,
        content: (
            <div className="space-y-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Drag & Drop</h3>
                        <p className="text-gray-400">
                            The floating bubble can be dragged anywhere on your screen. Its position is saved automatically.
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="text-purple-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Quick Access</h3>
                        <p className="text-gray-400">
                            Click to expand and access Chat, Summarize, Translate, Notes, and Settings.
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="text-pink-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Text Selection</h3>
                        <p className="text-gray-400">
                            Select text on any page and the bubble will auto-expand with the text pre-filled for summarization.
                        </p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 3,
        title: 'Features',
        description: 'Everything you need in one place',
        icon: CheckCircle,
        content: (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <MessageSquare className="text-blue-400 mb-3" size={32} />
                    <h3 className="text-lg font-semibold mb-2">AI Chat</h3>
                    <p className="text-gray-400 text-sm">
                        Ask questions, get instant answers powered by Groq's fast AI models.
                    </p>
                </div>
                <div className="glass-card p-6">
                    <FileText className="text-purple-400 mb-3" size={32} />
                    <h3 className="text-lg font-semibold mb-2">Summarize</h3>
                    <p className="text-gray-400 text-sm">
                        Quickly summarize long texts, articles, or documents with one click.
                    </p>
                </div>
                <div className="glass-card p-6">
                    <Languages className="text-pink-400 mb-3" size={32} />
                    <h3 className="text-lg font-semibold mb-2">Translate</h3>
                    <p className="text-gray-400 text-sm">
                        Translate text to multiple languages instantly with AI-powered accuracy.
                    </p>
                </div>
                <div className="glass-card p-6">
                    <CheckCircle className="text-green-400 mb-3" size={32} />
                    <h3 className="text-lg font-semibold mb-2">Tasks & Notes</h3>
                    <p className="text-gray-400 text-sm">
                        Keep track of your tasks and capture ideas with our note-taking features.
                    </p>
                </div>
            </div>
        )
    },
    {
        id: 4,
        title: "You're All Set!",
        description: 'Start exploring Nexa',
        icon: CheckCircle,
        content: (
            <div className="text-center space-y-6">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                    <CheckCircle className="text-white" size={48} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold mb-3">Ready to Go!</h3>
                    <p className="text-gray-300 text-lg max-w-md mx-auto mb-6">
                        You're all set to start using Nexa. The floating bubble is now active on all authenticated pages.
                    </p>
                    <div className="flex flex-col gap-3 max-w-sm mx-auto">
                        <div className="text-left text-sm text-gray-400 space-y-2">
                            <p>✓ Drag the bubble to your preferred position</p>
                            <p>✓ Click to expand and explore features</p>
                            <p>✓ Select text to auto-summarize</p>
                            <p>✓ Check out Notes and Tasks pages</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
];

export default function Onboarding() {
    const [currentStep, setCurrentStep] = useState(0);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const navigate = useNavigate();

    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        
        if (isLeftSwipe) {
            nextStep();
        } else if (isRightSwipe) {
            prevStep();
        }
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        localStorage.setItem('nexa.onboarding.completed', 'true');
        navigate('/');
    };

    const currentStepData = steps[currentStep];
    const Icon = currentStepData.icon;

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
            <div className="max-w-4xl w-full">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass-card p-8 md:p-12"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-400">
                                Step {currentStep + 1} of {steps.length}
                            </span>
                            <button
                                onClick={() => handleComplete()}
                                className="text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                Skip
                            </button>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                                className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                            />
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <Icon className="text-blue-400" size={24} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">{currentStepData.title}</h1>
                                <p className="text-gray-400">{currentStepData.description}</p>
                            </div>
                        </div>

                        <div className="mt-8">
                            {currentStepData.content}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between items-center pt-6 border-t border-white/10">
                        <button
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                                currentStep === 0
                                    ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                    : 'bg-white/5 hover:bg-white/10 text-white'
                            }`}
                        >
                            <ArrowLeft size={18} />
                            Previous
                        </button>

                        <div className="flex gap-2">
                            {steps.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-2 h-2 rounded-full transition-colors ${
                                        index === currentStep
                                            ? 'bg-blue-500'
                                            : index < currentStep
                                            ? 'bg-blue-500/50'
                                            : 'bg-white/20'
                                    }`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={nextStep}
                            className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium flex items-center gap-2 transition-all"
                        >
                            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                            {currentStep < steps.length - 1 && <ArrowRight size={18} />}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

