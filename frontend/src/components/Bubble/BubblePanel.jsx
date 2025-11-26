import React, { useState, useEffect } from 'react';
import { MessageSquare, FileText, Languages, StickyNote, Settings, Send, Copy, Check } from 'lucide-react';
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
                {activeTab === 'chat' && <ChatTab />}
                {activeTab === 'summarize' && <SummarizeTab />}
                {activeTab === 'translate' && <TranslateTab />}
                {activeTab === 'notes' && <NotesTab />}
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

function ChatTab() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useLocalStorage('nexa.history.chat', []);

    const sendMessage = async () => {
        if (!input.trim()) return;
        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/groq/generate', { prompt: input });
            // Backend returns: { ok: true, data: "message content", model: "..." }
            // Extract just the message string from res.data.data
            let messageContent = '';
            
            if (res.data && res.data.data) {
                // Extract the 'data' field which contains the actual message string
                messageContent = res.data.data;
            } else if (res.data && res.data.message) {
                // Fallback to message field
                messageContent = res.data.message;
            } else {
                messageContent = 'No response received.';
            }
            
            // Ensure it's a string (never an object or the full response)
            if (typeof messageContent !== 'string') {
                messageContent = String(messageContent);
            }
            
            setMessages(prev => [...prev, { role: 'assistant', content: messageContent }]);
            
            // Save to history
            setHistory(prev => [{
                prompt: input,
                response: messageContent,
                timestamp: new Date().toISOString()
            }, ...prev].slice(0, 100)); // Keep last 100 items
        } catch (err) {
            console.error('Chat error:', err);
            setMessages(prev => [...prev, { role: 'error', content: 'Failed to get response.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px]">
                {messages.map((m, i) => (
                    <div key={i} className={clsx("p-3 rounded-lg text-sm", m.role === 'user' ? "bg-neon-blue/10 ml-8" : "bg-white/5 mr-8")}>
                        {m.content}
                    </div>
                ))}
                {messages.length === 0 && <p className="text-center text-gray-500 text-sm mt-10">Start a conversation...</p>}
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask anything..."
                    className="input-field text-sm"
                />
                <Button size="sm" onClick={sendMessage} isLoading={loading} icon={Send} className="px-3" />
            </div>
        </div>
    );
}

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
    const [text, setText] = useState('');
    const [targetLang, setTargetLang] = useState('hi');
    const [translation, setTranslation] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useLocalStorage('nexa.history.translate', []);

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'Hindi' },
        { code: 'mr', name: 'Marathi' },
        { code: 'kn', name: 'Kannada' },
    ];

    useEffect(() => {
        // Listen for text selection events
        const handleTextSelected = (e) => {
            if (e.detail?.text) {
                setText(e.detail.text);
                setTranslation(''); // Clear previous translation
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

    const handleTranslate = async () => {
        if (!text.trim()) return;
        setLoading(true);
        setTranslation('');
        try {
            const langName = languages.find(l => l.code === targetLang)?.name || targetLang;
            const res = await api.post('/groq/generate', { 
                prompt: `Translate the following text to ${langName}:\n\n${text}` 
            });
            const translationText = res.data?.data || res.data?.message || 'No translation received.';
            setTranslation(translationText);
            
            // Save to history
            setHistory(prev => [{
                text,
                targetLang,
                translation: translationText,
                timestamp: new Date().toISOString()
            }, ...prev].slice(0, 100)); // Keep last 100 items
        } catch (err) {
            setTranslation('Error generating translation.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs text-gray-400 mb-2">Target Language</label>
                <select
                    value={targetLang}
                    onChange={e => setTargetLang(e.target.value)}
                    className="input-field text-sm bg-black/20 text-white"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                >
                    {languages.map(lang => (
                        <option key={lang.code} value={lang.code} style={{ backgroundColor: '#111827', color: '#ffffff' }}>{lang.name}</option>
                    ))}
                </select>
            </div>
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Paste text or select from page..."
                className="input-field h-32 resize-none text-sm"
            />
            <Button onClick={handleTranslate} isLoading={loading} className="w-full">Translate</Button>
            {translation && (
                <div className="p-3 bg-white/5 rounded-lg text-sm border border-white/10">
                    <h4 className="text-xs font-bold text-gray-400 mb-1">TRANSLATION</h4>
                    <p className="text-gray-300">{translation}</p>
                </div>
            )}
        </div>
    );
}

function NotesTab() {
    const [noteText, setNoteText] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [notes, setNotes] = useLocalStorage('nexa.quickNotes', '');

    useEffect(() => {
        // Load saved quick notes
        if (notes) {
            setNoteText(notes);
        }
    }, [notes]);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            // Save to localStorage for quick access
            setNotes(noteText);
            
            // If text is substantial, optionally save to backend
            if (noteText.trim().length > 20) {
                try {
                    await api.post('/notes', {
                        title: noteText.substring(0, 50) + (noteText.length > 50 ? '...' : ''),
                        content: noteText,
                        isPinned: false
                    });
                } catch (err) {
                    // Backend save is optional, localStorage is primary
                    console.log('Note saved locally only');
                }
            }
            
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Error saving note:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-3">
            <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Quick notes..."
                className="input-field flex-1 resize-none text-sm"
            />
            <Button 
                onClick={handleSave} 
                isLoading={saving}
                className="w-full"
            >
                {saved ? 'Saved!' : 'Save Notes'}
            </Button>
            <p className="text-xs text-gray-500 text-center">
                Notes are saved locally. Long notes may also be saved to your Notes page.
            </p>
        </div>
    );
}

function SettingsTab() {
    const [isEnabled, setIsEnabled] = useLocalStorage('nexa.bubble.enabled', true);
    const [language, setLanguage] = useLocalStorage('nexa.preferredLanguage', 'en');

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'Hindi' },
        { code: 'mr', name: 'Marathi' },
        { code: 'kn', name: 'Kannada' },
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

            <div className="flex items-center justify-between py-2">
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
