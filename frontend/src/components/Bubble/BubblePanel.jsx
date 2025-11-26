import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, FileText, Languages, StickyNote, Settings, Send, Copy, Check, Bot, Sparkles, Zap, CircleDot, Mic, Search, Calendar, Volume2, VolumeX, Trash2, X, Clock } from 'lucide-react';
import { Button } from '../../ui/Button';
import api from '../../api';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { clsx } from 'clsx';

export function BubblePanel({ isOpen, activeTab: initialTab = 'chat' }) {
    const [activeTab, setActiveTab] = useState(initialTab);

    // Update activeTab when initialTab prop changes
    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    if (!isOpen) return null;

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'summarize' && <SummarizeTab />}
                {activeTab === 'translate' && <TranslateTab />}
                {activeTab === 'quicknotes' && <QuickNotesTab />}
                {activeTab === 'voicenotes' && <VoiceNotesTab />}
                {activeTab === 'voicesearch' && <VoiceSearchTab />}
                {activeTab === 'tasks' && <TasksTab />}
                {activeTab === 'settings' && <SettingsTab />}
            </div>
        </div>
    );
}

function TabButton({ icon: Icon, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "p-2 rounded-lg transition-colors",
                active ? "bg-neon-blue/20 text-neon-blue" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
        >
            <Icon className="w-5 h-5" />
        </button>
    );
}

// Helper function to find the best voice for a language (from Meditator)
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
    
    let matchingVoice = null;
    
    if (langCode === 'kn') {
        matchingVoice = voices.find(voice => voice.lang === 'kn-IN') ||
                       voices.find(voice => voice.lang === 'kn') ||
                       voices.find(voice => voice.lang.toLowerCase().includes('kn-in')) ||
                       voices.find(voice => voice.lang.toLowerCase().startsWith('kn-')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('kannada')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('kn'));
        
        if (!matchingVoice) {
            matchingVoice = voices.find(voice => voice.lang === 'hi-IN' || voice.lang === 'hi' || 
                                                voice.name.toLowerCase().includes('hindi'));
        }
        
        if (!matchingVoice) {
            matchingVoice = voices.find(voice => voice.lang === 'en-IN' || 
                                                (voice.lang.startsWith('en-') && 
                                                 (voice.name.toLowerCase().includes('india') || 
                                                  voice.name.toLowerCase().includes('indian'))));
        }
    } else if (langCode === 'mr') {
        matchingVoice = voices.find(voice => voice.lang === 'mr-IN') ||
                       voices.find(voice => voice.lang === 'mr') ||
                       voices.find(voice => voice.lang.toLowerCase().includes('mr-in')) ||
                       voices.find(voice => voice.lang.toLowerCase().startsWith('mr-')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('marathi')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('mr'));
        
        if (!matchingVoice) {
            matchingVoice = voices.find(voice => voice.lang === 'hi-IN' || voice.lang === 'hi' || 
                                                voice.name.toLowerCase().includes('hindi'));
        }
        
        if (!matchingVoice) {
            matchingVoice = voices.find(voice => voice.lang === 'en-IN' || 
                                                (voice.lang.startsWith('en-') && 
                                                 (voice.name.toLowerCase().includes('india') || 
                                                  voice.name.toLowerCase().includes('indian'))));
        }
    } else if (langCode === 'hi') {
        matchingVoice = voices.find(voice => voice.lang === 'hi-IN') ||
                       voices.find(voice => voice.lang === 'hi') ||
                       voices.find(voice => voice.lang.toLowerCase().includes('hi-in')) ||
                       voices.find(voice => voice.lang.toLowerCase().startsWith('hi-')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('hindi') ||
                                           voice.name.toLowerCase().includes('हिन्दी'));
    } else if (langCode === 'en') {
        matchingVoice = voices.find(voice => voice.lang === 'en-US') ||
                       voices.find(voice => voice.lang.startsWith('en-') || voice.lang === 'en');
    }
    
    if (matchingVoice && ['kn', 'mr'].includes(langCode)) {
        const voiceLang = matchingVoice.lang.toLowerCase();
        const voiceName = matchingVoice.name.toLowerCase();
        if ((voiceLang === 'en-us' || voiceLang === 'en') && 
            !voiceName.includes('india') && 
            !voiceName.includes('indian') &&
            !voiceLang.includes('in')) {
            return null;
        }
    }
    
    if (matchingVoice && langCode === 'hi') {
        const voiceLang = matchingVoice.lang.toLowerCase();
        if (!voiceLang.includes('hi') && !matchingVoice.name.toLowerCase().includes('hindi') && 
            !matchingVoice.name.toLowerCase().includes('हिन्दी')) {
            return null;
        }
    }
    
    return matchingVoice;
}

const LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
];

function SummarizeTab() {
    const [text, setText] = useState('');
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useLocalStorage('nexa.history.summarize', []);

    useEffect(() => {
        // Listen for text selection events from Bubble component
        const handleTextSelected = (e) => {
            if (e.detail?.text) {
                setText(e.detail.text);
                setSummary(''); // Clear previous summary
            }
        };

        window.addEventListener('nexa-text-selected', handleTextSelected);
        
        // Also check current selection on mount
        const selection = window.getSelection().toString();
        if (selection && selection.length > 8) {
            setText(selection);
        }

        return () => {
            window.removeEventListener('nexa-text-selected', handleTextSelected);
        };
    }, []);

    const handleSummarize = async () => {
        if (!text.trim()) return;
        setLoading(true);
        setSummary('');
        try {
            const res = await api.post('/groq/generate', { prompt: `Summarize this:\n\n${text}` });
            const summaryText = res.data?.data || res.data?.message || 'No summary received.';
            setSummary(summaryText);
            
            // Save to history
            setHistory(prev => [{
                text,
                summary: summaryText,
                timestamp: new Date().toISOString()
            }, ...prev].slice(0, 100)); // Keep last 100 items
        } catch (err) {
            setSummary('Error generating summary.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Paste text or select from page..."
                className="input-field h-32 resize-none text-sm"
            />
            <Button onClick={handleSummarize} isLoading={loading} className="w-full">Summarize</Button>
            {summary && (
                <div className="p-3 bg-white/5 rounded-lg text-sm border border-white/10">
                    <h4 className="text-xs font-bold text-gray-400 mb-1">SUMMARY</h4>
                    <p className="text-gray-300">{summary}</p>
                </div>
            )}
        </div>
    );
}

function TranslateTab() {
    const [mode, setMode] = useState('text'); // 'text' or 'voice'
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('hi');
    const [text, setText] = useState('');
    const [translation, setTranslation] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);

    // Voice mode setup
    useEffect(() => {
        if (mode === 'voice' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
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
            recognitionRef.current.lang = langMap[sourceLang] || sourceLang;

            recognitionRef.current.onresult = async (event) => {
                const spokenText = event.results[0][0].transcript;
                setTranscript(spokenText);
                setText(spokenText);
                setIsListening(false);
                // Auto-translate
                await handleTranslate(spokenText);
            };

            recognitionRef.current.onerror = () => setIsListening(false);

            return () => {
                if (recognitionRef.current) recognitionRef.current.stop();
            };
        }
    }, [mode, sourceLang, targetLang]);

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            setIsListening(true);
            setTranscript('');
            recognitionRef.current.start();
        }
    };

    const handleTranslate = async (textToTranslate = null) => {
        const textToUse = textToTranslate || text;
        if (!textToUse.trim()) return;
        
        setLoading(true);
        setTranslation('');
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

Source text (${sourceLangName}): "${textToUse}"

Translated text (${targetLangName}):`;
            
            const res = await api.post('/groq/generate', {
                prompt: translationPrompt
            });
            
            // Extract and clean translation
            let translationText = '';
            if (res.data?.data) {
                translationText = typeof res.data.data === 'string' ? res.data.data : JSON.stringify(res.data.data);
            } else if (res.data?.message) {
                translationText = typeof res.data.message === 'string' ? res.data.message : JSON.stringify(res.data.message);
            } else if (typeof res.data === 'string') {
                translationText = res.data;
            }
            
            // Clean up the translation - remove any prefixes or explanations
            translationText = translationText.trim();
            
            // Remove common prefixes that AI might add
            translationText = translationText.replace(/^(Translation:|Translated text:|In .*?:|Here is the translation:|Translation in .*?:|The translation is:|Result:)/i, '').trim();
            
            // Extract text in quotes if present (remove quotes)
            if (translationText.includes('"')) {
                const quotedMatch = translationText.match(/"([^"]+)"/);
                if (quotedMatch) {
                    translationText = quotedMatch[1];
                } else {
                    // Remove surrounding quotes
                    translationText = translationText.replace(/^["']|["']$/g, '');
                }
            }
            
            // Remove any remaining source/target language labels
            translationText = translationText.replace(new RegExp(`(${sourceLangName}:|${targetLangName}:|${sourceLangName}|${targetLangName})`, 'gi'), '').trim();
            
            // Remove any line breaks or newlines at start/end
            translationText = translationText.replace(/^[\n\r]+|[\n\r]+$/g, '').trim();
            
            // Final validation - check if translation actually changed
            console.log(`Translation: "${textToUse}" (${sourceLangName}) -> "${translationText}" (${targetLangName})`);
            
            if (!translationText || translationText.length === 0) {
                console.warn('Translation is empty');
                translationText = 'Translation failed. Please try again.';
            } else if (translationText.toLowerCase().trim() === textToUse.toLowerCase().trim()) {
                console.warn('Translation may have failed - result same as input');
                translationText = 'Translation failed. The result is the same as input. Please check language settings.';
            }
            
            setTranslation(translationText);
            
            // Speak translation in voice mode
            if (mode === 'voice' && translationText && 'speechSynthesis' in window) {
                speechSynthesis.cancel();
                setTimeout(() => {
                    const utterance = new SpeechSynthesisUtterance(translationText);
                    utterance.lang = targetLang === 'en' ? 'en-US' : `${targetLang}-IN`;
                    const voice = findBestVoiceForLanguage(targetLang);
                    if (voice) utterance.voice = voice;
                    speechSynthesis.speak(utterance);
                }, 100);
            }
        } catch (err) {
            setTranslation('Error generating translation.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Mode Selection */}
            <div className="flex gap-2">
                <button
                    onClick={() => setMode('text')}
                    className={`flex-1 px-3 py-2 rounded text-xs font-semibold transition-all ${
                        mode === 'text' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : 'bg-white/5 text-gray-400 border border-white/10'
                    }`}
                >
                    Text
                </button>
                <button
                    onClick={() => setMode('voice')}
                    className={`flex-1 px-3 py-2 rounded text-xs font-semibold transition-all ${
                        mode === 'voice' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : 'bg-white/5 text-gray-400 border border-white/10'
                    }`}
                >
                    Voice
                </button>
            </div>

            {/* Language Selection */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-xs text-gray-400 mb-1">From</label>
                    <select
                        value={sourceLang}
                        onChange={e => setSourceLang(e.target.value)}
                        className="input-field text-xs bg-black/20 text-white w-full"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code} style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-400 mb-1">To</label>
                    <select
                        value={targetLang}
                        onChange={e => setTargetLang(e.target.value)}
                        className="input-field text-xs bg-black/20 text-white w-full"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                    >
                        {LANGUAGES.filter(l => l.code !== sourceLang).map(lang => (
                            <option key={lang.code} value={lang.code} style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Voice Mode */}
            {mode === 'voice' ? (
                <div className="space-y-3">
                    <button
                        onClick={isListening ? () => { recognitionRef.current?.stop(); setIsListening(false); } : startListening}
                        disabled={loading}
                        className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                            isListening ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' : 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                        }`}
                    >
                        <Mic size={16} />
                        {isListening ? 'Listening...' : 'Start Speaking'}
                    </button>
                    {transcript && (
                        <div className="p-2 bg-white/5 rounded text-xs">
                            <p className="text-gray-400 text-[10px] mb-1">You said:</p>
                            <p className="text-white">{transcript}</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Text Mode */
                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Enter text to translate..."
                    className="input-field h-24 resize-none text-sm"
                />
            )}

            {mode === 'text' && (
                <Button onClick={() => handleTranslate()} isLoading={loading} className="w-full" disabled={!text.trim()}>
                    Translate
                </Button>
            )}

            {translation && (
                <div className="p-3 bg-white/5 rounded-lg text-sm border border-white/10">
                    <h4 className="text-xs font-bold text-gray-400 mb-1">TRANSLATION</h4>
                    <p className="text-gray-300">{translation}</p>
                </div>
            )}
        </div>
    );
}

function QuickNotesTab() {
    const [noteText, setNoteText] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const res = await api.get('/notes');
            setNotes(res.data || []);
        } catch (err) {
            console.error('Error fetching notes:', err);
            setNotes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!noteText.trim()) return;
        setSaving(true);
        setSaved(false);
        try {
            const res = await api.post('/notes', {
                title: noteText.substring(0, 50) + (noteText.length > 50 ? '...' : ''),
                content: noteText,
                isPinned: false
            });
            setNotes([res.data, ...notes]);
            setNoteText('');
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            // Notify Notes page to refresh
            window.dispatchEvent(new CustomEvent('nexa-notes-updated'));
        } catch (err) {
            console.error('Error saving note:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (noteId) => {
        if (!window.confirm('Delete this note?')) return;
        try {
            await api.delete(`/notes/${noteId}`);
            setNotes(notes.filter(n => n._id !== noteId));
            // Notify Notes page to refresh
            window.dispatchEvent(new CustomEvent('nexa-notes-updated'));
        } catch (err) {
            console.error('Error deleting note:', err);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-3">
            <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Type your quick note..."
                className="input-field h-24 resize-none text-sm"
            />
            <Button 
                onClick={handleSave} 
                isLoading={saving}
                className="w-full"
                disabled={!noteText.trim()}
            >
                {saved ? 'Saved!' : 'Save Note'}
            </Button>
            
            <div className="border-t border-white/10 pt-3">
                <h4 className="text-xs font-bold text-gray-400 mb-2">Saved Notes</h4>
                {loading ? (
                    <p className="text-xs text-gray-500 text-center py-4">Loading...</p>
                ) : notes.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No notes saved yet</p>
                ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {notes.map((note) => (
                            <div key={note._id} className="p-2 bg-white/5 rounded text-xs border border-white/10">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-white truncate">{note.title}</p>
                                        <p className="text-gray-400 text-[10px] mt-1 line-clamp-2">{note.content}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(note._id)}
                                        className="text-red-400 hover:text-red-300 flex-shrink-0"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function VoiceNotesTab() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [savedNotes, setSavedNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [speechRate, setSpeechRate] = useState(1.0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playingNoteId, setPlayingNoteId] = useState(null);
    const recognitionRef = useRef(null);
    const synthRef = useRef(null);

    useEffect(() => {
        fetchVoiceNotes();
        
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
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
                setTranscript(prev => prev + finalTranscript);
            };

            recognitionRef.current.onerror = () => setIsListening(false);
        }

        if ('speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
            const handleEnd = () => {
                setIsPlaying(false);
                setPlayingNoteId(null);
            };
            synthRef.current.addEventListener('end', handleEnd);
            synthRef.current.addEventListener('error', handleEnd);
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
            if (synthRef.current) {
                synthRef.current.cancel();
                synthRef.current.removeEventListener('end', () => {});
                synthRef.current.removeEventListener('error', () => {});
            }
        };
    }, []);

    const fetchVoiceNotes = async () => {
        setLoading(true);
        try {
            const res = await api.get('/notes');
            setSavedNotes((res.data || []).filter(n => n.type === 'voice'));
        } catch (err) {
            console.error('Error fetching voice notes:', err);
            setSavedNotes([]);
        } finally {
            setLoading(false);
        }
    };

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
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

    const handleSave = async () => {
        if (!transcript.trim()) return;
        try {
            await api.post('/notes', {
                title: `Voice Note - ${new Date().toLocaleString()}`,
                content: transcript,
                type: 'voice'
            });
            setTranscript('');
            fetchVoiceNotes();
            // Show a brief success message
            alert('Voice note saved successfully!');
        } catch (err) {
            console.error('Error saving voice note:', err);
            alert('Error saving voice note. Please try again.');
        }
    };

    const handlePlay = (noteContent, noteId) => {
        if (!('speechSynthesis' in window) || !synthRef.current) {
            alert('Speech synthesis is not supported in your browser');
            return;
        }
        
        // Stop current playback if playing
        if (isPlaying) {
            synthRef.current.cancel();
            setIsPlaying(false);
            setPlayingNoteId(null);
            // If clicking the same note, just stop
            if (playingNoteId === noteId) {
                return;
            }
        }
        
        setIsPlaying(true);
        setPlayingNoteId(noteId);
        const utterance = new SpeechSynthesisUtterance(noteContent);
        utterance.rate = speechRate;
        utterance.lang = 'en-US';
        utterance.onend = () => {
            setIsPlaying(false);
            setPlayingNoteId(null);
        };
        utterance.onerror = () => {
            setIsPlaying(false);
            setPlayingNoteId(null);
        };
        synthRef.current.speak(utterance);
    };

    const handleDelete = async (noteId) => {
        if (!window.confirm('Delete this voice note?')) return;
        try {
            await api.delete(`/notes/${noteId}`);
            fetchVoiceNotes();
        } catch (err) {
            console.error('Error deleting note:', err);
        }
    };

    return (
        <div className="space-y-4">
            <div className="text-center">
                <button
                    onClick={isListening ? stopListening : startListening}
                    className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center transition-all ${
                        isListening ? 'bg-red-500/20 border-2 border-red-500 animate-pulse' : 'bg-blue-500/20 border-2 border-blue-500'
                    }`}
                >
                    <Mic size={24} className={isListening ? 'text-red-400' : 'text-blue-400'} />
                </button>
                <p className="text-xs text-gray-400 mt-2">{isListening ? 'Listening...' : 'Click to record'}</p>
            </div>

            {transcript && (
                <div className="space-y-2">
                    <textarea
                        value={transcript}
                        readOnly
                        className="input-field h-24 resize-none text-xs"
                    />
                    <Button onClick={handleSave} className="w-full" size="sm">Save Voice Note</Button>
                </div>
            )}

            <div className="border-t border-white/10 pt-3">
                <h4 className="text-xs font-bold text-gray-400 mb-2">Saved Voice Notes</h4>
                <div className="mb-2">
                    <label className="text-[10px] text-gray-500">Playback Speed: {speechRate.toFixed(1)}x</label>
                    <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={speechRate}
                        onChange={e => setSpeechRate(parseFloat(e.target.value))}
                        className="w-full h-1"
                    />
                </div>
                {loading ? (
                    <p className="text-xs text-gray-500 text-center py-4">Loading...</p>
                ) : savedNotes.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No voice notes yet</p>
                ) : (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                        {savedNotes.map((note) => (
                            <div key={note._id} className="p-3 bg-white/5 rounded-lg text-xs border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-semibold text-xs mb-1 truncate">{note.title}</p>
                                        {note.content && (
                                            <p className="text-gray-400 text-[10px] line-clamp-2 mb-2">
                                                {note.content.substring(0, 100)}{note.content.length > 100 ? '...' : ''}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handlePlay(note.content, note._id)}
                                            disabled={isPlaying && playingNoteId !== note._id}
                                            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${
                                                isPlaying && playingNoteId === note._id
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                                            } ${isPlaying && playingNoteId !== note._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title={isPlaying && playingNoteId === note._id ? 'Playing...' : 'Play voice note'}
                                        >
                                            {isPlaying && playingNoteId === note._id ? (
                                                <>
                                                    <VolumeX size={12} />
                                                    <span>Stop</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Volume2 size={12} />
                                                    <span>Play</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(note._id)}
                                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                                        title="Delete voice note"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function VoiceSearchTab() {
    const [isListening, setIsListening] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const recognitionRef = useRef(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const query = event.results[0][0].transcript;
                setSearchQuery(query);
                setIsListening(false);
                // Redirect to search
                performSearch(query);
            };

            recognitionRef.current.onerror = () => setIsListening(false);
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            setIsListening(true);
            setSearchQuery('');
            recognitionRef.current.start();
        }
    };

    const performSearch = (query) => {
        if (!query.trim()) return;
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        window.open(searchUrl, '_blank');
    };

    const handleTextSearch = () => {
        if (searchQuery.trim()) {
            performSearch(searchQuery);
        }
    };

    return (
        <div className="space-y-4">
            <div className="text-center">
                <button
                    onClick={startListening}
                    disabled={isListening}
                    className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center transition-all ${
                        isListening ? 'bg-red-500/20 border-2 border-red-500 animate-pulse' : 'bg-cyan-500/20 border-2 border-cyan-500'
                    }`}
                >
                    <Mic size={24} className={isListening ? 'text-red-400' : 'text-cyan-400'} />
                </button>
                <p className="text-xs text-gray-400 mt-2">{isListening ? 'Listening...' : 'Click to search by voice'}</p>
            </div>

            <div className="space-y-2">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Or type search query..."
                    className="input-field text-sm"
                    onKeyDown={e => e.key === 'Enter' && handleTextSearch()}
                />
                <Button onClick={handleTextSearch} className="w-full" disabled={!searchQuery.trim()} size="sm">
                    Search
                </Button>
            </div>

            {searchQuery && (
                <p className="text-xs text-gray-500 text-center">
                    Will search for: "{searchQuery}"
                </p>
            )}
        </div>
    );
}

function TasksTab() {
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, []);

    useEffect(() => {
        if (!loading && tasks.length > 0) {
            checkUpcomingTasks();
            // Check tasks every minute
            const interval = setInterval(checkUpcomingTasks, 60000);
            return () => clearInterval(interval);
        }
    }, [tasks, loading]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tasks');
            const tasks = res.data || res || [];
            setTasks(Array.isArray(tasks) ? tasks : []);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    const checkUpcomingTasks = () => {
        if (!tasks || tasks.length === 0) return;
        const now = new Date();
        tasks.forEach(task => {
            if (task && task.dueDate && !task.completed) {
                const dueDate = new Date(task.dueDate);
                const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
                if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
                    // Trigger notification
                    window.dispatchEvent(new CustomEvent('nexa-task-reminder', {
                        detail: { task }
                    }));
                }
            }
        });
    };

    const handleSave = async () => {
        if (!taskTitle.trim()) return;
        setSaving(true);
        try {
            let dueDateValue = null;
            if (dueDate) {
                const dateTime = dueTime ? `${dueDate}T${dueTime}` : `${dueDate}T23:59`;
                dueDateValue = new Date(dateTime).toISOString();
            }
            
            await api.post('/tasks', {
                title: taskTitle,
                description: taskDescription,
                dueDate: dueDateValue
            });
            
            setTaskTitle('');
            setTaskDescription('');
            setDueDate('');
            setDueTime('');
            fetchTasks();
        } catch (err) {
            console.error('Error saving task:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (taskId) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await api.delete(`/tasks/${taskId}`);
            fetchTasks();
        } catch (err) {
            console.error('Error deleting task:', err);
        }
    };

    const handleToggleComplete = async (task) => {
        try {
            await api.put(`/tasks/${task._id}`, {
                ...task,
                completed: !task.completed
            });
            fetchTasks();
        } catch (err) {
            console.error('Error updating task:', err);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <input
                    type="text"
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    placeholder="Task title..."
                    className="input-field text-sm"
                />
                <textarea
                    value={taskDescription}
                    onChange={e => setTaskDescription(e.target.value)}
                    placeholder="Description (optional)..."
                    className="input-field h-16 resize-none text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] text-gray-400">Due Date</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                            className="input-field text-xs w-full"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400">Time</label>
                        <input
                            type="time"
                            value={dueTime}
                            onChange={e => setDueTime(e.target.value)}
                            className="input-field text-xs w-full"
                        />
                    </div>
                </div>
                <Button onClick={handleSave} isLoading={saving} className="w-full" size="sm" disabled={!taskTitle.trim()}>
                    Add Task
                </Button>
            </div>

            <div className="border-t border-white/10 pt-3">
                <h4 className="text-xs font-bold text-gray-400 mb-2">Tasks</h4>
                {loading ? (
                    <p className="text-xs text-gray-500 text-center py-4">Loading...</p>
                ) : tasks.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No tasks yet</p>
                ) : (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                        {tasks.filter(t => !t.completed).map((task) => (
                            <div key={task._id} className="p-2 bg-white/5 rounded text-xs border border-white/10">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => handleToggleComplete(task)}
                                                className="w-3 h-3"
                                            />
                                            <p className="font-semibold text-white">{task.title}</p>
                                        </div>
                                        {task.description && (
                                            <p className="text-gray-400 text-[10px] mt-1">{task.description}</p>
                                        )}
                                        {task.dueDate && (
                                            <p className="text-orange-400 text-[10px] mt-1">
                                                <Clock size={10} className="inline mr-1" />
                                                {new Date(task.dueDate).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(task._id)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function SettingsTab() {
    const [isEnabled, setIsEnabled] = useLocalStorage('nexa.bubble.enabled', true);
    const [language, setLanguage] = useLocalStorage('nexa.preferredLanguage', 'en');
    const [bubbleIcon, setBubbleIcon] = useLocalStorage('nexa.bubble.icon', 'bot');

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'Hindi' },
        { code: 'mr', name: 'Marathi' },
        { code: 'kn', name: 'Kannada' },
    ];

    const bubbleIcons = [
        { id: 'bot', icon: Bot, label: 'Bot', color: 'text-blue-400' },
        { id: 'sparkles', icon: Sparkles, label: 'Sparkles', color: 'text-purple-400' },
        { id: 'zap', icon: Zap, label: 'Zap', color: 'text-yellow-400' },
        { id: 'circle', icon: CircleDot, label: 'Circle', color: 'text-green-400' },
    ];

    const handleToggleBubble = () => {
        setIsEnabled(!isEnabled);
        // Reload to apply changes
        setTimeout(() => window.location.reload(), 300);
    };

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-white text-sm mb-4">Settings</h3>
            
            <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-300">Bubble Enabled</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={handleToggleBubble}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
                </label>
            </div>

            <div className="py-3 border-t border-white/10">
                <p className="text-sm text-gray-300 mb-3">Bubble Theme</p>
                <div className="grid grid-cols-2 gap-2">
                                {bubbleIcons.map(({ id, icon: Icon, label, color }) => (
                                    <button
                                        key={id}
                                        onClick={() => setBubbleIcon(id)}
                                        className={clsx(
                                            "p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1",
                                            bubbleIcon === id
                                                ? "border-neon-blue bg-neon-blue/10"
                                                : "border-white/10 hover:border-white/20"
                                        )}
                                    >
                                        <Icon className={clsx("w-6 h-6", color)} />
                                        <span className="text-xs text-gray-300">{label}</span>
                                    </button>
                                ))}
                </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-white/10">
                <span className="text-sm text-gray-300">Language</span>
                <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                >
                    {languages.map(lang => (
                        <option key={lang.code} value={lang.code} style={{ backgroundColor: '#111827', color: '#ffffff' }}>{lang.name}</option>
                    ))}
                </select>
            </div>

            <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-gray-500">
                    Changes to bubble enabled/disabled will reload the page.
                </p>
            </div>
        </div>
    );
}
