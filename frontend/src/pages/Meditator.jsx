import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Languages, FileText, MessageSquare, Volume2, VolumeX, Trash2, X } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../api';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { motion } from 'framer-motion';

const LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
];

// Helper function to find the best voice for a language
function findBestVoiceForLanguage(langCode) {
    const voices = speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
        console.warn('No voices available in speech synthesis');
        return null;
    }
    
    const langCodes = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'mr': 'mr-IN',
        'kn': 'kn-IN'
    };
    const targetLang = langCodes[langCode] || langCode;
    
    let matchingVoice = null;
    
    if (langCode === 'kn') {
        // Kannada: prioritize exact matches
        matchingVoice = voices.find(voice => voice.lang === 'kn-IN') ||
                       voices.find(voice => voice.lang === 'kn') ||
                       voices.find(voice => voice.lang.toLowerCase().includes('kn-in')) ||
                       voices.find(voice => voice.lang.toLowerCase().startsWith('kn-')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('kannada')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('kn'));
        
        // Fallback: Use Hindi voice (better than English for Indian scripts)
        if (!matchingVoice) {
            matchingVoice = voices.find(voice => voice.lang === 'hi-IN' || voice.lang === 'hi' || 
                                                voice.name.toLowerCase().includes('hindi') ||
                                                voice.name.toLowerCase().includes('हिन्दी'));
        }
        
        // Last resort: Use Indian English (en-IN) which handles Indian scripts better
        if (!matchingVoice) {
            matchingVoice = voices.find(voice => voice.lang === 'en-IN' || 
                                                (voice.lang.startsWith('en-') && 
                                                 (voice.name.toLowerCase().includes('india') || 
                                                  voice.name.toLowerCase().includes('indian'))));
        }
        
        // Only log if no voice found at all (not for fallbacks)
        if (!matchingVoice) {
            console.warn('No Kannada voice found, even with fallbacks');
        }
    } else if (langCode === 'mr') {
        // Marathi: prioritize exact matches
        matchingVoice = voices.find(voice => voice.lang === 'mr-IN') ||
                       voices.find(voice => voice.lang === 'mr') ||
                       voices.find(voice => voice.lang.toLowerCase().includes('mr-in')) ||
                       voices.find(voice => voice.lang.toLowerCase().startsWith('mr-')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('marathi')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('mr'));
        
        // Fallback: Use Hindi voice (same script family - Devanagari)
        if (!matchingVoice) {
            matchingVoice = voices.find(voice => voice.lang === 'hi-IN' || voice.lang === 'hi' || 
                                                voice.name.toLowerCase().includes('hindi') ||
                                                voice.name.toLowerCase().includes('हिन्दी'));
        }
        
        // Last resort: Use Indian English (en-IN) which handles Devanagari script better
        if (!matchingVoice) {
            matchingVoice = voices.find(voice => voice.lang === 'en-IN' || 
                                                (voice.lang.startsWith('en-') && 
                                                 (voice.name.toLowerCase().includes('india') || 
                                                  voice.name.toLowerCase().includes('indian'))));
        }
        
        // Only log if no voice found at all (not for fallbacks)
        if (!matchingVoice) {
            console.warn('No Marathi voice found, even with fallbacks');
        }
    } else if (langCode === 'hi') {
        // Hindi: prioritize exact matches
        matchingVoice = voices.find(voice => voice.lang === 'hi-IN') ||
                       voices.find(voice => voice.lang === 'hi') ||
                       voices.find(voice => voice.lang.toLowerCase().includes('hi-in')) ||
                       voices.find(voice => voice.lang.toLowerCase().startsWith('hi-')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('hindi') ||
                                           voice.name.toLowerCase().includes('हिन्दी'));
    } else if (langCode === 'en') {
        // English: prefer US English, fallback to any English
        matchingVoice = voices.find(voice => voice.lang === 'en-US') ||
                       voices.find(voice => voice.lang.startsWith('en-') || voice.lang === 'en');
    }
    
    // For Indian languages (kn, mr), we accept Hindi or Indian English as fallbacks
    // But still reject US English voices
    if (matchingVoice && ['kn', 'mr'].includes(langCode)) {
        const voiceLang = matchingVoice.lang.toLowerCase();
        const voiceName = matchingVoice.name.toLowerCase();
        // Only reject if it's US English (en-US), allow hi-IN or en-IN
        if ((voiceLang === 'en-us' || voiceLang === 'en') && 
            !voiceName.includes('india') && 
            !voiceName.includes('indian') &&
            !voiceLang.includes('in')) {
            console.warn(`Rejected US English voice for ${langCode}:`, matchingVoice.name);
            return null;
        }
    }
    
        // For Hindi, reject non-Hindi voices
        if (matchingVoice && langCode === 'hi') {
            const voiceLang = matchingVoice.lang.toLowerCase();
            if (!voiceLang.includes('hi') && !matchingVoice.name.toLowerCase().includes('hindi') && 
                !matchingVoice.name.toLowerCase().includes('हिन्दी')) {
                return null;
            }
        }
        
        return matchingVoice;
}

export default function Meditator() {
    const [activeInterface, setActiveInterface] = useState('voice'); // 'voice' or 'text'
    const [micPermission, setMicPermission] = useState(null); // null, 'granted', 'denied'
    const [isListening, setIsListening] = useState(false);

    // Check microphone permission on mount
    useEffect(() => {
        checkMicrophonePermission();
    }, []);

    const checkMicrophonePermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            setMicPermission('granted');
        } catch (err) {
            setMicPermission('denied');
            console.error('Microphone permission denied:', err);
        }
    };

    const requestMicrophonePermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            setMicPermission('granted');
        } catch (err) {
            setMicPermission('denied');
            alert('Microphone permission is required for voice features. Please enable it in your browser settings.');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white pt-28 pb-12 px-6 md:px-12">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            Meditator
                        </h1>
                    </div>
                    <p className="text-gray-400 ml-0">Your AI-powered translation and conversation mediator</p>
                </motion.div>

                {/* Interface Selection */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setActiveInterface('voice')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                            activeInterface === 'voice'
                                ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-500/50'
                                : 'bg-white/5 text-gray-400 border-2 border-white/10 hover:bg-white/10'
                        }`}
                    >
                        <Mic size={20} />
                        Voice Interface
                    </button>
                    <button
                        onClick={() => setActiveInterface('text')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                            activeInterface === 'text'
                                ? 'bg-purple-500/20 text-purple-400 border-2 border-purple-500/50'
                                : 'bg-white/5 text-gray-400 border-2 border-white/10 hover:bg-white/10'
                        }`}
                    >
                        <FileText size={20} />
                        Text Interface
                    </button>
                </div>

                {/* Microphone Permission Alert */}
                {activeInterface === 'voice' && micPermission !== 'granted' && (
                    <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <MicOff className="text-yellow-400" size={24} />
                            <div>
                                <p className="font-semibold text-yellow-400">Microphone Permission Required</p>
                                <p className="text-sm text-gray-400">Please allow microphone access to use voice features</p>
                            </div>
                        </div>
                        <Button onClick={requestMicrophonePermission} variant="primary">
                            Grant Permission
                        </Button>
                    </div>
                )}

                {/* Interface Content */}
                {activeInterface === 'voice' && micPermission === 'granted' && <VoiceInterface />}
                {activeInterface === 'text' && <TextInterface micPermission={micPermission} requestPermission={requestMicrophonePermission} />}
                {activeInterface === 'voice' && micPermission === 'denied' && (
                    <div className="text-center py-12 text-gray-400">
                        <MicOff className="mx-auto mb-4 text-red-400" size={48} />
                        <p className="text-lg">Microphone access denied. Please enable it in your browser settings.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Voice Interface Component
function VoiceInterface() {
    const [mode, setMode] = useState('basic'); // 'basic' or 'conversation'
    const [voiceHistory, setVoiceHistory] = useLocalStorage('nexa.meditator.voice.history', []);
    const [showHistory, setShowHistory] = useState(false);

    return (
        <div className="space-y-6">
            {/* Mode Selection */}
            <div className="flex gap-4">
                <button
                    onClick={() => setMode('basic')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                        mode === 'basic'
                            ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-500/50'
                            : 'bg-white/5 text-gray-400 border-2 border-white/10 hover:bg-white/10'
                    }`}
                >
                    <Languages size={20} />
                    Basic Translation
                </button>
                <button
                    onClick={() => setMode('conversation')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                        mode === 'conversation'
                            ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-500/50'
                            : 'bg-white/5 text-gray-400 border-2 border-white/10 hover:bg-white/10'
                    }`}
                >
                    <MessageSquare size={20} />
                    Conversation Mode
                </button>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 bg-white/5 text-gray-400 border-2 border-white/10 hover:bg-white/10"
                >
                    History ({voiceHistory.length})
                </button>
            </div>

            {/* History Panel */}
            {showHistory && (
                <VoiceHistory 
                    history={voiceHistory} 
                    setHistory={setVoiceHistory}
                    onClose={() => setShowHistory(false)}
                />
            )}

            {/* Mode Content */}
            {!showHistory && mode === 'basic' && <BasicVoiceTranslation history={voiceHistory} setHistory={setVoiceHistory} />}
            {!showHistory && mode === 'conversation' && <ConversationMode history={voiceHistory} setHistory={setVoiceHistory} />}
        </div>
    );
}

// Basic Voice Translation
function BasicVoiceTranslation({ history, setHistory }) {
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('hi');
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [translation, setTranslation] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const recognitionRef = useRef(null);
    const synthRef = useRef(null);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        
        // Set language based on source language
        const langMap = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'mr': 'mr-IN',
            'kn': 'kn-IN'
        };
        recognitionRef.current.lang = langMap[sourceLang] || sourceLang;

        recognitionRef.current.onresult = async (event) => {
            const text = event.results[0][0].transcript;
            setTranscript(text);
            setIsListening(false);
            
            // Translate the text
            setIsTranslating(true);
            try {
                const sourceLangName = LANGUAGES.find(l => l.code === sourceLang)?.name || sourceLang;
                const targetLangName = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;
                const sourceNativeName = LANGUAGES.find(l => l.code === sourceLang)?.nativeName || '';
                const targetNativeName = LANGUAGES.find(l => l.code === targetLang)?.nativeName || '';
                
                // More explicit translation prompt
                const translationPrompt = `You are a professional translator. Your task is to translate text from ${sourceLangName}${sourceNativeName ? ` (${sourceNativeName})` : ''} to ${targetLangName}${targetNativeName ? ` (${targetNativeName})` : ''}.

CRITICAL INSTRUCTIONS:
- INPUT LANGUAGE: ${sourceLangName}${sourceNativeName ? ` (${sourceNativeName})` : ''}
- OUTPUT LANGUAGE: ${targetLangName}${targetNativeName ? ` (${targetNativeName})` : ''}
- You MUST translate FROM ${sourceLangName} TO ${targetLangName}
- Do NOT return the text in ${sourceLangName}, only return it in ${targetLangName}
- Only output the translated text - nothing else
- Do not include "Translation:", explanations, or any labels
- Do not include the original text
- Do not use quotation marks

Source text (${sourceLangName}): "${text}"

Translated text (${targetLangName}):`;
                
                const res = await api.post('/groq/generate', {
                    prompt: translationPrompt
                });
                
                // Extract and clean translation
                let translatedText = '';
                if (res.data?.data) {
                    translatedText = typeof res.data.data === 'string' ? res.data.data : JSON.stringify(res.data.data);
                } else if (res.data?.message) {
                    translatedText = typeof res.data.message === 'string' ? res.data.message : JSON.stringify(res.data.message);
                } else if (typeof res.data === 'string') {
                    translatedText = res.data;
                }
                
                // Clean up the translation - remove any prefixes or explanations
                translatedText = translatedText.trim();
                
                // Remove common prefixes that AI might add
                translatedText = translatedText.replace(/^(Translation:|Translated text:|In .*?:|Here is the translation:|Translation in .*?:|The translation is:|Result:)/i, '').trim();
                
                // Extract text in quotes if present (remove quotes)
                if (translatedText.includes('"')) {
                    const quotedMatch = translatedText.match(/"([^"]+)"/);
                    if (quotedMatch) {
                        translatedText = quotedMatch[1];
                    } else {
                        // Remove surrounding quotes
                        translatedText = translatedText.replace(/^["']|["']$/g, '');
                    }
                }
                
                // Remove any remaining source/target language labels
                translatedText = translatedText.replace(new RegExp(`(${sourceLangName}:|${targetLangName}:|${sourceLangName}|${targetLangName})`, 'gi'), '').trim();
                
                // Remove any line breaks or newlines at start/end
                translatedText = translatedText.replace(/^[\n\r]+|[\n\r]+$/g, '').trim();
                
                // Final validation - check if translation actually changed
                console.log(`Translation: "${text}" (${sourceLangName}) -> "${translatedText}" (${targetLangName})`);
                
                if (!translatedText || translatedText.length === 0) {
                    console.warn('Translation is empty');
                    translatedText = 'Translation failed. Please try again.';
                } else if (translatedText.toLowerCase().trim() === text.toLowerCase().trim()) {
                    console.warn('Translation may have failed - result same as input');
                    translatedText = 'Translation failed. The result is the same as input. Please check language settings.';
                }
                
                setTranslation(translatedText);
                
                // Save to history
                const historyItem = {
                    id: Date.now(),
                    mode: 'basic',
                    sourceLang,
                    targetLang,
                    originalText: text,
                    translatedText,
                    timestamp: new Date().toISOString()
                };
                setHistory(prev => [historyItem, ...prev].slice(0, 100));
                
                // Speak the translation
                if (translatedText && 'speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(translatedText);
                    const langCodes = {
                        'en': 'en-US',
                        'hi': 'hi-IN',
                        'mr': 'mr-IN',
                        'kn': 'kn-IN'
                    };
                    utterance.lang = langCodes[targetLang] || targetLang;
                    const targetVoice = findBestVoiceForLanguage(targetLang);
                    if (targetVoice) {
                        utterance.voice = targetVoice;
                    }
                    speechSynthesis.speak(utterance);
                }
            } catch (err) {
                console.error('Translation error:', err);
                setTranslation('Translation failed. Please try again.');
            } finally {
                setIsTranslating(false);
            }
        };

        recognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        // Load voices
        if ('speechSynthesis' in window) {
            speechSynthesis.onvoiceschanged = () => {
                synthRef.current = speechSynthesis.getVoices();
            };
            synthRef.current = speechSynthesis.getVoices();
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (speechSynthesis) {
                speechSynthesis.cancel();
            }
        };
    }, [sourceLang, targetLang, setHistory]);

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            setTranslation('');
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    return (
        <div className="glass-card p-6">
            <h2 className="text-2xl font-bold mb-6">Basic Voice Translation</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Source Language</label>
                    <select
                        value={sourceLang}
                        onChange={(e) => setSourceLang(e.target.value)}
                        className="input-field bg-black/20 text-white"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code} style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                                {lang.name} ({lang.nativeName})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Target Language</label>
                    <select
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="input-field bg-black/20 text-white"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                    >
                        {LANGUAGES.filter(l => l.code !== sourceLang).map(lang => (
                            <option key={lang.code} value={lang.code} style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                                {lang.name} ({lang.nativeName})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="text-center space-y-6">
                <button
                    onClick={isListening ? stopListening : startListening}
                    className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all ${
                        isListening
                            ? 'bg-red-500/20 border-4 border-red-500 animate-pulse'
                            : 'bg-blue-500/20 border-4 border-blue-500 hover:bg-blue-500/30'
                    }`}
                    disabled={isTranslating}
                >
                    {isListening ? (
                        <Mic className="text-red-400" size={40} />
                    ) : (
                        <MicOff className="text-blue-400" size={40} />
                    )}
                </button>
                <p className="text-sm text-gray-400">
                    {isListening ? 'Listening... Click to stop' : isTranslating ? 'Translating...' : 'Click to start speaking'}
                </p>

                {transcript && (
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-left">
                        <p className="text-xs text-gray-400 mb-2">You said:</p>
                        <p className="text-white">{transcript}</p>
                    </div>
                )}

                {translation && (
                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30 text-left">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-blue-400 font-bold">Translation:</p>
                            <button
                                onClick={() => {
                                    const utterance = new SpeechSynthesisUtterance(translation);
                                    const langCodes = {
                                        'en': 'en-US',
                                        'hi': 'hi-IN',
                                        'mr': 'mr-IN',
                                        'kn': 'kn-IN'
                                    };
                                    utterance.lang = langCodes[targetLang] || targetLang;
                                    const targetVoice = findBestVoiceForLanguage(targetLang);
                                    if (targetVoice) {
                                        utterance.voice = targetVoice;
                                    }
                                    speechSynthesis.speak(utterance);
                                }}
                                className="text-blue-400 hover:text-blue-300"
                            >
                                <Volume2 size={16} />
                            </button>
                        </div>
                        <p className="text-white">{translation}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Conversation Mode
function ConversationMode({ history, setHistory }) {
    const [person1Lang, setPerson1Lang] = useState('en');
    const [person2Lang, setPerson2Lang] = useState('hi');
    const [currentSpeaker, setCurrentSpeaker] = useState(null); // 'person1' or 'person2'
    const [person1Transcript, setPerson1Transcript] = useState('');
    const [person2Transcript, setPerson2Transcript] = useState('');
    const [person1Translation, setPerson1Translation] = useState('');
    const [person2Translation, setPerson2Translation] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        
        const langMap = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'mr': 'mr-IN',
            'kn': 'kn-IN'
        };

        // Load voices for TTS
        if ('speechSynthesis' in window) {
            const loadVoices = () => {
                const voices = speechSynthesis.getVoices();
                console.log('Voices loaded:', voices.length, 'voices available');
            };
            
            loadVoices();
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = loadVoices;
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (speechSynthesis) {
                speechSynthesis.cancel();
            }
        };
    }, [person1Lang, person2Lang, setHistory]);

    const startListening = async (speaker) => {
        if (!recognitionRef.current || isListening) return;
        
        setCurrentSpeaker(speaker);
        setIsListening(true);
        const lang = speaker === 'person1' ? person1Lang : person2Lang;
        const langMap = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'mr': 'mr-IN',
            'kn': 'kn-IN'
        };
        recognitionRef.current.lang = langMap[lang] || lang;

        // Set up result handler
        recognitionRef.current.onresult = async (event) => {
            const text = event.results[0][0].transcript;
            const targetLang = speaker === 'person1' ? person2Lang : person1Lang;
            
            // Update transcript
            if (speaker === 'person1') {
                setPerson1Transcript(text);
                setPerson1Translation(''); // Clear previous translation
            } else {
                setPerson2Transcript(text);
                setPerson2Translation(''); // Clear previous translation
            }

            // Translate and speak
            try {
                const sourceLangName = LANGUAGES.find(l => l.code === lang)?.name || lang;
                const targetLangName = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;
                const sourceNativeName = LANGUAGES.find(l => l.code === lang)?.nativeName || '';
                const targetNativeName = LANGUAGES.find(l => l.code === targetLang)?.nativeName || '';
                
                // More explicit translation prompt
                const translationPrompt = `Translate the following text from ${sourceLangName}${sourceNativeName ? ` (${sourceNativeName})` : ''} to ${targetLangName}${targetNativeName ? ` (${targetNativeName})` : ''}. 

IMPORTANT INSTRUCTIONS:
1. Only return the translated text in ${targetLangName}
2. Do not include explanations, notes, or any other text
3. Do not include the original text
4. Do not use quotation marks
5. Just output the translation directly

Text: "${text}"
Translation:`;
                
                const res = await api.post('/groq/generate', {
                    prompt: translationPrompt
                });
                
                // Extract translation from response - handle different response formats
                let translatedText = '';
                if (res.data?.data) {
                    translatedText = typeof res.data.data === 'string' ? res.data.data : JSON.stringify(res.data.data);
                } else if (res.data?.message) {
                    translatedText = typeof res.data.message === 'string' ? res.data.message : JSON.stringify(res.data.message);
                } else if (typeof res.data === 'string') {
                    translatedText = res.data;
                }
                
                // Clean up the translation - remove any prefixes or explanations
                translatedText = translatedText.trim();
                // Remove common prefixes that AI might add
                translatedText = translatedText.replace(/^(Translation:|Translated text:|In .*?:|Here is the translation:)/i, '').trim();
                // Extract text in quotes if present
                const quotedMatch = translatedText.match(/"([^"]+)"/);
                if (quotedMatch) {
                    translatedText = quotedMatch[1];
                }
                
                console.log(`Translation: ${text} (${lang}) -> ${translatedText} (${targetLang})`);
                
                if (!translatedText || translatedText.toLowerCase() === text.toLowerCase()) {
                    console.warn('Translation may have failed - result same as input');
                }
                
                // Store translation in state for display
                if (speaker === 'person1') {
                    setPerson1Translation(translatedText);
                } else {
                    setPerson2Translation(translatedText);
                }
                
                // Save to history
                const historyItem = {
                    id: Date.now(),
                    mode: 'conversation',
                    speaker,
                    sourceLang: lang,
                    targetLang,
                    originalText: text,
                    translatedText,
                    timestamp: new Date().toISOString()
                };
                setHistory(prev => [historyItem, ...prev].slice(0, 100));

                // Speak translation
                if (translatedText && 'speechSynthesis' in window) {
                    // Cancel any ongoing speech first
                    speechSynthesis.cancel();
                    
                    // Wait for voices and speak
                    const doSpeak = () => {
                        const voices = speechSynthesis.getVoices();
                        if (voices.length === 0) {
                            // Voices not loaded yet, wait for them
                            if (speechSynthesis.onvoiceschanged) {
                                const voiceHandler = () => {
                                    speechSynthesis.onvoiceschanged = null;
                                    doSpeak();
                                };
                                speechSynthesis.onvoiceschanged = voiceHandler;
                            } else {
                                // Fallback: try again after delay
                                setTimeout(doSpeak, 300);
                            }
                            return;
                        }
                        
                        // Small delay after cancellation
                        setTimeout(() => {
                            const utterance = new SpeechSynthesisUtterance(translatedText);
                            const langCodes = {
                                'en': 'en-US',
                                'hi': 'hi-IN',
                                'mr': 'mr-IN',
                                'kn': 'kn-IN'
                            };
                            utterance.lang = langCodes[targetLang] || targetLang;
                            utterance.rate = 1.0;
                            utterance.pitch = 1.0;
                            utterance.volume = 1.0;
                            
                            // Find and set voice
                            const targetVoice = findBestVoiceForLanguage(targetLang);
                            if (targetVoice) {
                                utterance.voice = targetVoice;
                                console.log(`Speaking for ${speaker}: Using ${targetVoice.name} (${targetVoice.lang})`);
                            } else {
                                console.warn(`No voice found for ${targetLang}, using browser default`);
                            }
                            
                            // Event handlers
                            utterance.onstart = () => {
                                console.log(`✓ Started speaking ${targetLang} for ${speaker}`);
                            };
                            
                            utterance.onend = () => {
                                console.log(`✓ Finished speaking ${targetLang} for ${speaker}`);
                            };
                            
                            utterance.onerror = (event) => {
                                console.error(`✗ Speech error for ${speaker}:`, event.error, event);
                            };
                            
                            // Speak
                            try {
                                speechSynthesis.speak(utterance);
                            } catch (err) {
                                console.error(`Error calling speak() for ${speaker}:`, err);
                            }
                        }, 150);
                    };
                    
                    doSpeak();
                }
            } catch (err) {
                console.error('Translation error:', err);
                alert(`Translation failed. Error: ${err.response?.data?.message || err.message}`);
            }

            setIsListening(false);
            setCurrentSpeaker(null);
        };

        recognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            setCurrentSpeaker(null);
        };

        recognitionRef.current.start();
    };

    return (
        <div className="glass-card p-6">
            <h2 className="text-2xl font-bold mb-6">Conversation Mode</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Person 1 */}
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Person 1 Language</label>
                    <select
                        value={person1Lang}
                        onChange={(e) => setPerson1Lang(e.target.value)}
                        className="input-field bg-black/20 text-white mb-4"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code} style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                                {lang.name} ({lang.nativeName})
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => startListening('person1')}
                        disabled={isListening}
                        className={`w-full py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                            currentSpeaker === 'person1'
                                ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-500/50 animate-pulse'
                                : 'bg-white/5 text-gray-400 border-2 border-white/10 hover:bg-white/10'
                        }`}
                    >
                        <Mic size={20} />
                        Person 1 Speak
                    </button>
                    {person1Transcript && (
                        <div className="mt-4 space-y-2">
                            <div className="p-3 bg-white/5 rounded-lg text-sm">
                                <p className="text-gray-400 text-xs mb-1">Said:</p>
                                <p className="text-white">{person1Transcript}</p>
                            </div>
                            {person1Translation && (
                                <div className="p-3 bg-blue-500/10 rounded-lg text-sm border border-blue-500/30">
                                    <p className="text-blue-400 text-xs mb-1">Translation ({LANGUAGES.find(l => l.code === person2Lang)?.name}):</p>
                                    <p className="text-white">{person1Translation}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Person 2 */}
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Person 2 Language</label>
                    <select
                        value={person2Lang}
                        onChange={(e) => setPerson2Lang(e.target.value)}
                        className="input-field bg-black/20 text-white mb-4"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code} style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                                {lang.name} ({lang.nativeName})
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => startListening('person2')}
                        disabled={isListening}
                        className={`w-full py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                            currentSpeaker === 'person2'
                                ? 'bg-purple-500/20 text-purple-400 border-2 border-purple-500/50 animate-pulse'
                                : 'bg-white/5 text-gray-400 border-2 border-white/10 hover:bg-white/10'
                        }`}
                    >
                        <Mic size={20} />
                        Person 2 Speak
                    </button>
                    {person2Transcript && (
                        <div className="mt-4 space-y-2">
                            <div className="p-3 bg-white/5 rounded-lg text-sm">
                                <p className="text-gray-400 text-xs mb-1">Said:</p>
                                <p className="text-white">{person2Transcript}</p>
                            </div>
                            {person2Translation && (
                                <div className="p-3 bg-purple-500/10 rounded-lg text-sm border border-purple-500/30">
                                    <p className="text-purple-400 text-xs mb-1">Translation ({LANGUAGES.find(l => l.code === person1Lang)?.name}):</p>
                                    <p className="text-white">{person2Translation}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="text-center text-sm text-gray-400">
                <p>Select who is speaking, then click their button and speak. The translation will be spoken automatically.</p>
            </div>
        </div>
    );
}

// Text Interface Component
function TextInterface({ micPermission, requestPermission }) {
    const [mode, setMode] = useState('translate'); // 'translate' or 'dictate'
    const [textHistory, setTextHistory] = useLocalStorage('nexa.meditator.text.history', []);
    const [showHistory, setShowHistory] = useState(false);

    return (
        <div className="space-y-6">
            {/* Mode Selection */}
            <div className="flex gap-4">
                <button
                    onClick={() => setMode('translate')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                        mode === 'translate'
                            ? 'bg-purple-500/20 text-purple-400 border-2 border-purple-500/50'
                            : 'bg-white/5 text-gray-400 border-2 border-white/10 hover:bg-white/10'
                    }`}
                >
                    <Languages size={20} />
                    Translate
                </button>
                <button
                    onClick={() => setMode('dictate')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                        mode === 'dictate'
                            ? 'bg-purple-500/20 text-purple-400 border-2 border-purple-500/50'
                            : 'bg-white/5 text-gray-400 border-2 border-white/10 hover:bg-white/10'
                    }`}
                >
                    <Volume2 size={20} />
                    Dictate
                </button>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 bg-white/5 text-gray-400 border-2 border-white/10 hover:bg-white/10"
                >
                    History ({textHistory.length})
                </button>
            </div>

            {/* History Panel */}
            {showHistory && (
                <TextHistory 
                    history={textHistory} 
                    setHistory={setTextHistory}
                    onClose={() => setShowHistory(false)}
                />
            )}

            {/* Mode Content */}
            {!showHistory && mode === 'translate' && <TextTranslation history={textHistory} setHistory={setTextHistory} />}
            {!showHistory && mode === 'dictate' && (
                <TextToSpeechFeature 
                    history={textHistory} 
                    setHistory={setTextHistory}
                />
            )}
        </div>
    );
}

// Text Translation Feature
function TextTranslation({ history, setHistory }) {
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('hi');
    const [inputText, setInputText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);

    const handleTranslate = async () => {
        if (!inputText.trim()) return;
        setIsTranslating(true);
        try {
            const sourceLangName = LANGUAGES.find(l => l.code === sourceLang)?.name || sourceLang;
            const targetLangName = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;
            const res = await api.post('/groq/generate', {
                prompt: `Translate the following text from ${sourceLangName} to ${targetLangName}:\n\n${inputText}`
            });
            const translation = res.data?.data || res.data?.message || '';
            setTranslatedText(translation);
            
            // Save to history
            const historyItem = {
                id: Date.now(),
                mode: 'translate',
                sourceLang,
                targetLang,
                originalText: inputText,
                translatedText: translation,
                timestamp: new Date().toISOString()
            };
            setHistory(prev => [historyItem, ...prev].slice(0, 100));
        } catch (err) {
            console.error('Translation error:', err);
            setTranslatedText('Translation failed. Please try again.');
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <div className="glass-card p-6">
            <h2 className="text-2xl font-bold mb-6">Text Translation</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Source Language</label>
                    <select
                        value={sourceLang}
                        onChange={(e) => setSourceLang(e.target.value)}
                        className="input-field bg-black/20 text-white"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code} style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                                {lang.name} ({lang.nativeName})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Target Language</label>
                    <select
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="input-field bg-black/20 text-white"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                    >
                        {LANGUAGES.filter(l => l.code !== sourceLang).map(lang => (
                            <option key={lang.code} value={lang.code} style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                                {lang.name} ({lang.nativeName})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Enter Text</label>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="input-field h-48 resize-none"
                        placeholder="Type or paste text to translate..."
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Translation</label>
                    <textarea
                        value={translatedText}
                        readOnly
                        className="input-field h-48 resize-none bg-white/5"
                        placeholder="Translation will appear here..."
                    />
                </div>
            </div>

            <div className="mt-6 flex justify-center">
                <Button onClick={handleTranslate} isLoading={isTranslating} className="px-8">
                    Translate
                </Button>
            </div>
        </div>
    );
}

// Text to Speech Feature
function TextToSpeechFeature({ history, setHistory }) {
    const [inputText, setInputText] = useState('');
    const [selectedLang, setSelectedLang] = useState('en');
    const [speechRate, setSpeechRate] = useState(1.0); // 0.5 to 2.0
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceWarning, setVoiceWarning] = useState('');
    const [savedTexts, setSavedTexts] = useLocalStorage('nexa.meditator.tts.saved', []);
    const utteranceRef = useRef(null);
    const synthRef = useRef(null);

    useEffect(() => {
        // Load available voices
        if ('speechSynthesis' in window) {
            const loadVoices = () => {
                synthRef.current = speechSynthesis.getVoices();
            };
            
            // Load voices immediately
            loadVoices();
            
            // Some browsers load voices asynchronously
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = loadVoices;
            }
        }

        // Cleanup on unmount
        return () => {
            if (speechSynthesis) {
                speechSynthesis.cancel();
            }
        };
    }, []);

    const speakText = () => {
        if (!inputText.trim()) return;
        
        if (!('speechSynthesis' in window)) {
            alert('Text-to-speech is not supported in your browser.');
            return;
        }

        // Cancel any ongoing speech
        speechSynthesis.cancel();

        // Create new utterance
        const utterance = new SpeechSynthesisUtterance(inputText);
        
        // Set proper language code
        const langCodes = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'mr': 'mr-IN',
            'kn': 'kn-IN'
        };
        utterance.lang = langCodes[selectedLang] || selectedLang;
        utterance.rate = speechRate;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Use improved voice selection helper
        const matchingVoice = findBestVoiceForLanguage(selectedLang);
        if (matchingVoice) {
            utterance.voice = matchingVoice;
            
            // Show warning if using fallback voice for Marathi/Kannada
            if (selectedLang === 'mr' && matchingVoice.lang !== 'mr-IN' && matchingVoice.lang !== 'mr') {
                if (matchingVoice.lang === 'hi-IN' || matchingVoice.name.toLowerCase().includes('hindi')) {
                    setVoiceWarning('Note: Native Marathi voice not available. Using Hindi voice instead.');
                } else if (matchingVoice.lang === 'en-IN' || matchingVoice.name.toLowerCase().includes('india')) {
                    setVoiceWarning('Note: Native Marathi voice not available. Using Indian English voice instead.');
                }
            } else if (selectedLang === 'kn' && matchingVoice.lang !== 'kn-IN' && matchingVoice.lang !== 'kn') {
                if (matchingVoice.lang === 'hi-IN' || matchingVoice.name.toLowerCase().includes('hindi')) {
                    setVoiceWarning('Note: Native Kannada voice not available. Using Hindi voice instead.');
                } else if (matchingVoice.lang === 'en-IN' || matchingVoice.name.toLowerCase().includes('india')) {
                    setVoiceWarning('Note: Native Kannada voice not available. Using Indian English voice instead.');
                }
            } else {
                setVoiceWarning('');
            }
        } else if (['kn', 'mr'].includes(selectedLang)) {
            setVoiceWarning('Warning: No suitable voice found for this language. Pronunciation may not be accurate.');
        } else {
            setVoiceWarning('');
        }

        // Set up event handlers
        utterance.onstart = () => {
            setIsSpeaking(true);
        };

        utterance.onend = () => {
            setIsSpeaking(false);
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            setIsSpeaking(false);
            setVoiceWarning('');
            alert('An error occurred while speaking. Please try again.');
        };

        utteranceRef.current = utterance;
        speechSynthesis.speak(utterance);

        // Save to history
        const historyItem = {
            id: Date.now(),
            mode: 'tts',
            text: inputText,
            language: selectedLang,
            rate: speechRate,
            timestamp: new Date().toISOString()
        };
        setHistory(prev => [historyItem, ...prev].slice(0, 100));
    };

    const stopSpeaking = () => {
        if (speechSynthesis) {
            speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    const saveText = () => {
        if (!inputText.trim()) return;
        const savedItem = {
            id: Date.now(),
            text: inputText,
            language: selectedLang,
            rate: speechRate,
            timestamp: new Date().toISOString()
        };
        setSavedTexts(prev => [savedItem, ...prev].slice(0, 50));
        alert('Text saved successfully!');
    };

    const loadSavedText = (item) => {
        setInputText(item.text);
        setSelectedLang(item.language || 'en');
        setSpeechRate(item.rate || 1.0);
    };

    return (
        <div className="glass-card p-6">
            <h2 className="text-2xl font-bold mb-6">Dictate</h2>
            
            <div className="space-y-6">
                {/* Language Selection */}
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Select Language</label>
                    <select
                        value={selectedLang}
                        onChange={(e) => {
                            setSelectedLang(e.target.value);
                            setVoiceWarning(''); // Clear warning on language change
                        }}
                        className="input-field bg-black/20 text-white"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                        disabled={isSpeaking}
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code} style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                                {lang.name} ({lang.nativeName})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Text Input */}
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Enter Text to Speak</label>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="input-field h-48 resize-none"
                        placeholder="Type or paste the text you want to hear..."
                        disabled={isSpeaking}
                    />
                </div>

                {/* Speech Rate Control */}
                <div>
                    <label className="block text-sm text-gray-400 mb-2">
                        Speech Speed: {speechRate.toFixed(1)}x
                    </label>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500">0.5x</span>
                        <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={speechRate}
                            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            disabled={isSpeaking}
                        />
                        <span className="text-xs text-gray-500">2.0x</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Slow</span>
                        <span>Normal</span>
                        <span>Fast</span>
                    </div>
                </div>

                {/* Voice Warning */}
                {voiceWarning && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-sm text-yellow-400">
                        {voiceWarning}
                    </div>
                )}

                {/* Control Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={isSpeaking ? stopSpeaking : speakText}
                        disabled={!inputText.trim()}
                        className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                            isSpeaking
                                ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50 hover:bg-red-500/30'
                                : 'bg-purple-500/20 text-purple-400 border-2 border-purple-500/50 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                    >
                        {isSpeaking ? (
                            <>
                                <VolumeX size={20} />
                                Stop Speaking
                            </>
                        ) : (
                            <>
                                <Volume2 size={20} />
                                Speak Text
                            </>
                        )}
                    </button>
                    <Button 
                        onClick={saveText} 
                        disabled={!inputText.trim() || isSpeaking} 
                        variant="secondary"
                        className="flex-1"
                    >
                        Save Text
                    </Button>
                    <Button 
                        onClick={() => {
                            stopSpeaking();
                            setInputText('');
                        }} 
                        variant="secondary"
                        className="flex-1"
                        disabled={isSpeaking}
                    >
                        Clear
                    </Button>
                </div>

                {/* Saved Texts */}
                {savedTexts.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Saved Texts</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {savedTexts.map((item) => (
                                <div key={item.id} className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm text-white">{item.text.substring(0, 100)}{item.text.length > 100 ? '...' : ''}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {LANGUAGES.find(l => l.code === item.language)?.name || item.language} • 
                                            {item.rate?.toFixed(1) || '1.0'}x • 
                                            {new Date(item.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => loadSavedText(item)}
                                            className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                                            disabled={isSpeaking}
                                        >
                                            Load
                                        </button>
                                        <button
                                            onClick={() => setSavedTexts(prev => prev.filter(t => t.id !== item.id))}
                                            className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                                            disabled={isSpeaking}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Voice History Component
function VoiceHistory({ history, setHistory, onClose }) {
    const clearHistory = () => {
        if (window.confirm('Are you sure you want to clear all history?')) {
            setHistory([]);
        }
    };

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Voice History</h2>
                <div className="flex gap-2">
                    {history.length > 0 && (
                        <Button onClick={clearHistory} variant="secondary" icon={Trash2}>
                            Clear All
                        </Button>
                    )}
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {history.length === 0 ? (
                <p className="text-center text-gray-400 py-12">No history yet</p>
            ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {history.map((item) => (
                        <div key={item.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <span className="text-xs text-gray-400">
                                        {item.mode === 'basic' ? 'Basic Translation' : 'Conversation'}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">
                                        {new Date(item.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setHistory(prev => prev.filter(h => h.id !== item.id))}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-xs text-gray-400">Original:</p>
                                    <p className="text-white">{item.originalText}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Translation:</p>
                                    <p className="text-blue-400">{item.translatedText}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Text History Component
function TextHistory({ history, setHistory, onClose }) {
    const clearHistory = () => {
        if (window.confirm('Are you sure you want to clear all history?')) {
            setHistory([]);
        }
    };

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Text History</h2>
                <div className="flex gap-2">
                    {history.length > 0 && (
                        <Button onClick={clearHistory} variant="secondary" icon={Trash2}>
                            Clear All
                        </Button>
                    )}
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {history.length === 0 ? (
                <p className="text-center text-gray-400 py-12">No history yet</p>
            ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {history.map((item) => (
                        <div key={item.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <span className="text-xs text-gray-400">
                                        {item.mode === 'translate' ? 'Translation' : item.mode === 'tts' ? 'Text to Speech' : 'Dictation'}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">
                                        {new Date(item.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setHistory(prev => prev.filter(h => h.id !== item.id))}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            {item.mode === 'translate' ? (
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-xs text-gray-400">Original:</p>
                                        <p className="text-white">{item.originalText}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Translation:</p>
                                        <p className="text-blue-400">{item.translatedText}</p>
                                    </div>
                                </div>
                            ) : item.mode === 'tts' ? (
                                <div className="space-y-1">
                                    <p className="text-white">{item.text}</p>
                                    <p className="text-xs text-gray-500">
                                        {LANGUAGES.find(l => l.code === item.language)?.name || item.language} • 
                                        {item.rate?.toFixed(1) || '1.0'}x speed
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-white">{item.text}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

