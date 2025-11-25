import React, { useState, useEffect } from 'react';
import { MessageSquare, FileText, Languages, StickyNote, Settings, Send, Copy, Check } from 'lucide-react';
import { Button } from '../../ui/Button';
import api from '../../api';
import { clsx } from 'clsx';

export function BubblePanel({ isOpen }) {
    const [activeTab, setActiveTab] = useState('chat');

    if (!isOpen) return null;

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-around p-2 border-b border-white/10">
                <TabButton icon={MessageSquare} active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
                <TabButton icon={FileText} active={activeTab === 'summarize'} onClick={() => setActiveTab('summarize')} />
                <TabButton icon={Languages} active={activeTab === 'translate'} onClick={() => setActiveTab('translate')} />
                <TabButton icon={StickyNote} active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} />
                <TabButton icon={Settings} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            </div>

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

    const sendMessage = async () => {
        if (!input.trim()) return;
        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/groq/generate', { prompt: input });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
        } catch (err) {
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

    useEffect(() => {
        // Listen for selection from parent or just check current selection
        const selection = window.getSelection().toString();
        if (selection) setText(selection);
    }, []);

    const handleSummarize = async () => {
        if (!text) return;
        setLoading(true);
        try {
            const res = await api.post('/groq/generate', { prompt: `Summarize this:\n\n${text}` });
            setSummary(res.data.response);
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
                    {summary}
                </div>
            )}
        </div>
    );
}

function TranslateTab() {
    return <div className="text-center text-gray-500 mt-10">Translation coming soon...</div>;
}

function NotesTab() {
    return <div className="text-center text-gray-500 mt-10">Notes coming soon...</div>;
}

function SettingsTab() {
    return (
        <div className="space-y-4">
            <h3 className="font-bold text-white">Settings</h3>
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Theme</span>
                <select className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm">
                    <option>Dark</option>
                    <option>Light</option>
                </select>
            </div>
        </div>
    );
}
