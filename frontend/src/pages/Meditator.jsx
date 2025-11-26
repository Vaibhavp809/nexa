import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Languages, FileText, MessageSquare, Volume2, VolumeX, Trash2, X } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../api';
import { useLocalStorage } from '../hooks/useLocalStorage';

const LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
];

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
        <div className="min-h-screen bg-black text-white p-6 md:p-12 pt-24">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-2">
                        Meditator
                    </h1>
                    <p className="text-gray-400">Your AI-powered translation and conversation mediator</p>
                </div>

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
                const res = await api.post('/groq/generate', {
                    prompt: `Translate the following text from ${sourceLangName} to ${targetLangName}:\n\n${text}`
                });
                const translatedText = res.data?.data || res.data?.message || '';
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
                    const targetVoice = speechSynthesis.getVoices().find(voice => 
                        voice.lang.startsWith(targetLang) || voice.lang === targetLang
                    );
                    if (targetVoice) utterance.voice = targetVoice;
                    utterance.lang = targetLang;
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
                                    const targetVoice = speechSynthesis.getVoices().find(voice => 
                                        voice.lang.startsWith(targetLang) || voice.lang === targetLang
                                    );
                                    if (targetVoice) utterance.voice = targetVoice;
                                    utterance.lang = targetLang;
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

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
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
            } else {
                setPerson2Transcript(text);
            }

            // Translate and speak
            try {
                const sourceLangName = LANGUAGES.find(l => l.code === lang)?.name || lang;
                const targetLangName = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;
                const res = await api.post('/groq/generate', {
                    prompt: `Translate the following text from ${sourceLangName} to ${targetLangName}:\n\n${text}`
                });
                const translatedText = res.data?.data || res.data?.message || '';
                
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
                    const utterance = new SpeechSynthesisUtterance(translatedText);
                    const targetVoice = speechSynthesis.getVoices().find(voice => 
                        voice.lang.startsWith(targetLang) || voice.lang === targetLang
                    );
                    if (targetVoice) utterance.voice = targetVoice;
                    utterance.lang = targetLang;
                    speechSynthesis.speak(utterance);
                }
            } catch (err) {
                console.error('Translation error:', err);
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
                        <div className="mt-4 p-3 bg-white/5 rounded-lg text-sm">
                            <p className="text-gray-400 text-xs mb-1">Last said:</p>
                            <p className="text-white">{person1Transcript}</p>
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
                        <div className="mt-4 p-3 bg-white/5 rounded-lg text-sm">
                            <p className="text-gray-400 text-xs mb-1">Last said:</p>
                            <p className="text-white">{person2Transcript}</p>
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
                    <Mic size={20} />
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
                <DictateFeature 
                    history={textHistory} 
                    setHistory={setTextHistory}
                    micPermission={micPermission}
                    requestPermission={requestPermission}
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

// Dictate Feature
function DictateFeature({ history, setHistory, micPermission, requestPermission }) {
    const [isListening, setIsListening] = useState(false);
    const [dictatedText, setDictatedText] = useState('');
    const [savedTexts, setSavedTexts] = useLocalStorage('nexa.meditator.dictate.saved', []);
    const recognitionRef = useRef(null);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            return;
        }

        if (micPermission === 'granted') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                setDictatedText(prev => prev + finalTranscript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [micPermission]);

    const startDictating = () => {
        if (micPermission !== 'granted') {
            requestPermission();
            return;
        }
        if (recognitionRef.current && !isListening) {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const stopDictating = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const saveText = () => {
        if (!dictatedText.trim()) return;
        const savedItem = {
            id: Date.now(),
            text: dictatedText,
            timestamp: new Date().toISOString()
        };
        setSavedTexts(prev => [savedItem, ...prev].slice(0, 50));
        
        // Also save to history
        const historyItem = {
            id: Date.now(),
            mode: 'dictate',
            text: dictatedText,
            timestamp: new Date().toISOString()
        };
        setHistory(prev => [historyItem, ...prev].slice(0, 100));
        
        setDictatedText('');
        alert('Text saved successfully!');
    };

    const loadSavedText = (text) => {
        setDictatedText(text);
    };

    if (micPermission !== 'granted') {
        return (
            <div className="glass-card p-6 text-center">
                <MicOff className="mx-auto mb-4 text-yellow-400" size={48} />
                <p className="text-lg text-gray-400 mb-4">Microphone permission required for dictation</p>
                <Button onClick={requestPermission}>Grant Permission</Button>
            </div>
        );
    }

    return (
        <div className="glass-card p-6">
            <h2 className="text-2xl font-bold mb-6">Dictate</h2>
            
            <div className="space-y-6">
                <div className="text-center">
                    <button
                        onClick={isListening ? stopDictating : startDictating}
                        className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all ${
                            isListening
                                ? 'bg-red-500/20 border-4 border-red-500 animate-pulse'
                                : 'bg-purple-500/20 border-4 border-purple-500 hover:bg-purple-500/30'
                        }`}
                    >
                        {isListening ? (
                            <Mic className="text-red-400" size={40} />
                        ) : (
                            <MicOff className="text-purple-400" size={40} />
                        )}
                    </button>
                    <p className="text-sm text-gray-400 mt-4">
                        {isListening ? 'Listening... Click to stop' : 'Click to start dictating'}
                    </p>
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-2">Dictated Text</label>
                    <textarea
                        value={dictatedText}
                        onChange={(e) => setDictatedText(e.target.value)}
                        className="input-field h-64 resize-none"
                        placeholder="Your dictated text will appear here... You can also type manually."
                    />
                </div>

                <div className="flex gap-4">
                    <Button onClick={saveText} disabled={!dictatedText.trim()} className="flex-1">
                        Save Text
                    </Button>
                    <Button onClick={() => setDictatedText('')} variant="secondary" className="flex-1">
                        Clear
                    </Button>
                </div>

                {savedTexts.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Saved Texts</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {savedTexts.map((item) => (
                                <div key={item.id} className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm text-white">{item.text.substring(0, 100)}{item.text.length > 100 ? '...' : ''}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(item.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => loadSavedText(item.text)}
                                            className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                                        >
                                            Load
                                        </button>
                                        <button
                                            onClick={() => setSavedTexts(prev => prev.filter(t => t.id !== item.id))}
                                            className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
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
                                        {item.mode === 'translate' ? 'Translation' : 'Dictation'}
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

