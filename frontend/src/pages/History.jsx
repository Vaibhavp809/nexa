import React, { useState, useEffect } from 'react';
import { Trash2, FileText, Languages, MessageSquare, Clock, Search } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { motion, AnimatePresence } from 'framer-motion';

export default function History() {
    const [summarizeHistory, setSummarizeHistory] = useLocalStorage('nexa.history.summarize', []);
    const [translateHistory, setTranslateHistory] = useLocalStorage('nexa.history.translate', []);
    const [chatHistory, setChatHistory] = useLocalStorage('nexa.history.chat', []);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Load history from GroqDemo if it exists
    useEffect(() => {
        const groqHistory = localStorage.getItem('nexa.groqHistory');
        if (groqHistory) {
            try {
                const parsed = JSON.parse(groqHistory);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Migrate to new chat history format
                    const migrated = parsed.map(item => ({
                        type: 'chat',
                        prompt: item.prompt,
                        response: item.response,
                        timestamp: item.timestamp || new Date().toISOString(),
                    }));
                    if (chatHistory.length === 0 || JSON.stringify(migrated) !== JSON.stringify(chatHistory)) {
                        setChatHistory([...migrated, ...chatHistory]);
                    }
                }
            } catch (err) {
                console.error('Error migrating history:', err);
            }
        }
    }, []);

    const allHistory = [
        ...summarizeHistory.map(h => ({ ...h, type: 'summarize' })),
        ...translateHistory.map(h => ({ ...h, type: 'translate' })),
        ...chatHistory.map(h => ({ ...h, type: 'chat' })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const filteredHistory = allHistory.filter(item => {
        if (activeTab !== 'all' && item.type !== activeTab) return false;
        const searchLower = searchQuery.toLowerCase();
        return (
            item.text?.toLowerCase().includes(searchLower) ||
            item.prompt?.toLowerCase().includes(searchLower) ||
            item.response?.toLowerCase().includes(searchLower) ||
            item.translation?.toLowerCase().includes(searchLower)
        );
    });

    const clearHistory = (type = 'all') => {
        if (window.confirm(`Are you sure you want to clear ${type === 'all' ? 'all' : type} history?`)) {
            if (type === 'all' || type === 'summarize') {
                setSummarizeHistory([]);
            }
            if (type === 'all' || type === 'translate') {
                setTranslateHistory([]);
            }
            if (type === 'all' || type === 'chat') {
                setChatHistory([]);
            }
        }
    };

    const deleteItem = (item) => {
        if (item.type === 'summarize') {
            setSummarizeHistory(summarizeHistory.filter(h => h.timestamp !== item.timestamp));
        } else if (item.type === 'translate') {
            setTranslateHistory(translateHistory.filter(h => h.timestamp !== item.timestamp));
        } else if (item.type === 'chat') {
            setChatHistory(chatHistory.filter(h => h.timestamp !== item.timestamp));
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'summarize':
                return FileText;
            case 'translate':
                return Languages;
            case 'chat':
                return MessageSquare;
            default:
                return MessageSquare;
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'summarize':
                return 'Summarize';
            case 'translate':
                return 'Translate';
            case 'chat':
                return 'Chat';
            default:
                return 'Unknown';
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 pt-28">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            History
                        </h1>
                    </div>
                    <p className="text-gray-400 ml-0">View your past queries and responses</p>
                </motion.div>

                <div className="flex flex-col md:flex-row justify-end items-center mb-8 gap-6">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search history..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {filteredHistory.length > 0 && (
                            <button
                                onClick={() => clearHistory()}
                                className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={18} />
                                Clear All
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-white/10">
                    {['all', 'chat', 'summarize', 'translate'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 border-b-2 transition-colors capitalize ${
                                activeTab === tab
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* History List */}
                {filteredHistory.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <Clock className="mx-auto mb-4 text-gray-400" size={48} />
                        <h3 className="text-xl font-semibold text-gray-300">No history yet</h3>
                        <p className="text-gray-500 mt-2">
                            Your {activeTab === 'all' ? 'queries' : activeTab} will appear here
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {filteredHistory.map((item, index) => {
                                const Icon = getIcon(item.type);
                                return (
                                    <motion.div
                                        key={`${item.type}-${item.timestamp}-${index}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="glass-card p-6 hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                                    <Icon className="text-blue-400" size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-xs font-bold text-blue-400 uppercase">
                                                            {getTypeLabel(item.type)}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(item.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    
                                                    {(item.text || item.prompt) && (
                                                        <div className="mb-3">
                                                            <p className="text-sm text-gray-400 mb-1">Input:</p>
                                                            <p className="text-white">{item.text || item.prompt}</p>
                                                        </div>
                                                    )}

                                                    {(item.summary || item.translation || item.response) && (
                                                        <div>
                                                            <p className="text-sm text-gray-400 mb-1">
                                                                {item.type === 'translate' ? 'Translation' : 
                                                                 item.type === 'summarize' ? 'Summary' : 'Response'}:
                                                            </p>
                                                            <p className="text-gray-300 whitespace-pre-wrap">
                                                                {item.summary || item.translation || item.response}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => deleteItem(item)}
                                                className="p-2 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}


