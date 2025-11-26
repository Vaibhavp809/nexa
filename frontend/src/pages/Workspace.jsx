import React, { useState } from 'react';
import { Mic, MicOff, FileText, Languages, Send, MessageSquare, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../ui/Button';
import Bubble from '../components/Bubble/Bubble';
import api from '../api';
import { motion } from 'framer-motion';

export default function Workspace() {
    // Voice Interface State
    const [voiceActive, setVoiceActive] = useState(false);
    const [voiceMode, setVoiceMode] = useState('conversational'); // conversational, translation, summarization, dictation
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const [voiceResult, setVoiceResult] = useState('');
    
    // Text Interface State
    const [textInput, setTextInput] = useState('');
    const [documentInput, setDocumentInput] = useState('');
    const [textMode, setTextMode] = useState('translate'); // translate, summarize, chat, document
    const [targetLanguage, setTargetLanguage] = useState('en');
    const [textResult, setTextResult] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSummarize = async () => {
        if (!textInput.trim()) return;
        setLoading(true);
        setResult('');
        try {
            const res = await api.post('/groq/generate', { 
                prompt: `Summarize this:\n\n${textInput}` 
            });
            const summary = res.data?.data || res.data?.message || 'No summary received.';
            setResult(summary);
        } catch (err) {
            setResult('Error generating summary.');
        } finally {
            setLoading(false);
        }
    };

    const handleTranslate = async () => {
        if (!textInput.trim()) return;
        setLoading(true);
        setResult('');
        try {
            const res = await api.post('/groq/generate', { 
                prompt: `Translate the following text to English:\n\n${textInput}` 
            });
            const translation = res.data?.data || res.data?.message || 'No translation received.';
            setResult(translation);
        } catch (err) {
            setResult('Error generating translation.');
        } finally {
            setLoading(false);
        }
    };

    const handleProcessDocument = async () => {
        if (!documentInput.trim()) return;
        setLoading(true);
        setResult('');
        try {
            const res = await api.post('/groq/generate', { 
                prompt: `Process and summarize this document:\n\n${documentInput}` 
            });
            const processed = res.data?.data || res.data?.message || 'No result received.';
            setResult(processed);
        } catch (err) {
            setResult('Error processing document.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 pt-28">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 overflow-visible"
                >
                    <div className="flex items-start gap-4 mb-4 overflow-visible">
                        <h1 className="text-4xl md:text-5xl font-bold heading-gradient leading-tight py-1 overflow-visible">
                            Workspace
                        </h1>
                    </div>
                    <p className="text-gray-400 ml-0">Your AI-powered workspace - Voice & Text interfaces</p>
                </motion.div>

                {/* Split Layout: Voice (First Half) + Text (Second Half) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* FIRST HALF: Voice Interface */}
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Mic className="text-blue-400" size={28} />
                                    Voice Interface
                                </h2>
                            </div>
                            
                            {/* Voice Mode Selection */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button
                                    onClick={() => setVoiceMode('conversational')}
                                    className={`p-3 rounded-lg border-2 transition-all text-sm ${
                                        voiceMode === 'conversational'
                                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                            : 'border-white/10 hover:border-white/20 text-gray-400'
                                    }`}
                                >
                                    <MessageSquare size={20} className="mx-auto mb-1" />
                                    Conversational
                                </button>
                                <button
                                    onClick={() => setVoiceMode('translation')}
                                    className={`p-3 rounded-lg border-2 transition-all text-sm ${
                                        voiceMode === 'translation'
                                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                            : 'border-white/10 hover:border-white/20 text-gray-400'
                                    }`}
                                >
                                    <Languages size={20} className="mx-auto mb-1" />
                                    Translation
                                </button>
                                <button
                                    onClick={() => setVoiceMode('summarization')}
                                    className={`p-3 rounded-lg border-2 transition-all text-sm ${
                                        voiceMode === 'summarization'
                                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                            : 'border-white/10 hover:border-white/20 text-gray-400'
                                    }`}
                                >
                                    <FileText size={20} className="mx-auto mb-1" />
                                    Summarization
                                </button>
                                <button
                                    onClick={() => setVoiceMode('dictation')}
                                    className={`p-3 rounded-lg border-2 transition-all text-sm ${
                                        voiceMode === 'dictation'
                                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                            : 'border-white/10 hover:border-white/20 text-gray-400'
                                    }`}
                                >
                                    <Mic size={20} className="mx-auto mb-1" />
                                    Dictation
                                </button>
                            </div>
                            
                            {/* Voice Recording Area */}
                            <div className="text-center space-y-4">
                                <button
                                    onClick={() => setVoiceActive(!voiceActive)}
                                    className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all ${
                                        voiceActive
                                            ? 'bg-red-500/20 border-4 border-red-500 animate-pulse'
                                            : 'bg-blue-500/20 border-4 border-blue-500 hover:bg-blue-500/30'
                                    }`}
                                >
                                    {voiceActive ? (
                                        <Mic className="text-red-400" size={40} />
                                    ) : (
                                        <MicOff className="text-blue-400" size={40} />
                                    )}
                                </button>
                                <p className="text-sm text-gray-400">
                                    {voiceActive ? 'Listening... Click to stop' : 'Click to start voice input'}
                                </p>
                                
                                {voiceTranscript && (
                                    <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10 text-left">
                                        <p className="text-xs text-gray-400 mb-2">Transcript:</p>
                                        <p className="text-gray-300">{voiceTranscript}</p>
                                    </div>
                                )}
                                
                                {voiceResult && (
                                    <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30 text-left">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs text-blue-400 font-bold">Result:</p>
                                            <button
                                                onClick={() => {
                                                    const utterance = new SpeechSynthesisUtterance(voiceResult);
                                                    speechSynthesis.speak(utterance);
                                                }}
                                                className="text-blue-400 hover:text-blue-300"
                                            >
                                                <Volume2 size={16} />
                                            </button>
                                        </div>
                                        <p className="text-gray-300">{voiceResult}</p>
                                    </div>
                                )}
                            </div>
                            
                            <p className="text-xs text-gray-500 mt-4 text-center">
                                Speech-to-text functionality will be fully integrated soon. Currently in development.
                            </p>
                        </div>
                    </div>
                    
                    {/* SECOND HALF: Text Interface */}
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <FileText className="text-purple-400" size={28} />
                                    Text Interface
                                </h2>
                            </div>
                            
                            {/* Text Mode Selection */}
                            <div className="flex gap-2 mb-4 flex-wrap">
                                <button
                                    onClick={() => setTextMode('translate')}
                                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                                        textMode === 'translate'
                                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                                            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    <Languages size={18} />
                                    Translate
                                </button>
                                <button
                                    onClick={() => setTextMode('summarize')}
                                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                                        textMode === 'summarize'
                                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                                            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    <FileText size={18} />
                                    Summarize
                                </button>
                                <button
                                    onClick={() => setTextMode('chat')}
                                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                                        textMode === 'chat'
                                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                                            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    <MessageSquare size={18} />
                                    Chat AI
                                </button>
                                <button
                                    onClick={() => setTextMode('document')}
                                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                                        textMode === 'document'
                                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                                            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    <FileText size={18} />
                                    Document
                                </button>
                            </div>

                            {/* Input Area */}
                            {textMode === 'document' ? (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <textarea
                                            value={documentInput}
                                            onChange={e => setDocumentInput(e.target.value)}
                                            placeholder="Paste or type document content here, or drag and drop a file..."
                                            className="input-field h-64 resize-none"
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const file = e.dataTransfer.files[0];
                                                if (file && file.type.startsWith('text/')) {
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        setDocumentInput(event.target.result);
                                                    };
                                                    reader.readAsText(file);
                                                }
                                            }}
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Drag and drop text files here</p>
                                    </div>
                                    <Button 
                                        onClick={handleProcessDocument} 
                                        isLoading={loading}
                                        className="w-full"
                                    >
                                        Process Document
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {textMode === 'translate' && (
                                        <select
                                            value={targetLanguage}
                                            onChange={(e) => setTargetLanguage(e.target.value)}
                                            className="input-field bg-black/20 text-white"
                                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                                        >
                                            <option value="en" style={{ backgroundColor: '#111827', color: '#ffffff' }}>English</option>
                                            <option value="hi" style={{ backgroundColor: '#111827', color: '#ffffff' }}>Hindi</option>
                                            <option value="mr" style={{ backgroundColor: '#111827', color: '#ffffff' }}>Marathi</option>
                                            <option value="kn" style={{ backgroundColor: '#111827', color: '#ffffff' }}>Kannada</option>
                                        </select>
                                    )}
                                    <textarea
                                        value={textInput}
                                        onChange={e => setTextInput(e.target.value)}
                                        placeholder={
                                            textMode === 'summarize' 
                                                ? "Enter text to summarize..." 
                                                : textMode === 'translate'
                                                ? `Enter text to translate to ${targetLanguage}...`
                                                : "Ask a question or paste document content for AI chat..."
                                        }
                                        className="input-field h-48 resize-none"
                                    />
                                    <Button 
                                        onClick={async () => {
                                            if (!textInput.trim()) return;
                                            setLoading(true);
                                            setTextResult('');
                                            try {
                                                let prompt = '';
                                                if (textMode === 'summarize') {
                                                    prompt = `Summarize this text:\n\n${textInput}`;
                                                } else if (textMode === 'translate') {
                                                    prompt = `Translate the following text to ${targetLanguage}:\n\n${textInput}`;
                                                } else if (textMode === 'chat') {
                                                    prompt = textInput;
                                                }
                                                
                                                const res = await api.post('/groq/generate', { prompt });
                                                const result = res.data?.data || res.data?.message || 'No response received.';
                                                setTextResult(result);
                                            } catch (err) {
                                                setTextResult('Error processing request.');
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        isLoading={loading}
                                        className="w-full"
                                    >
                                        {textMode === 'summarize' ? 'Summarize' : textMode === 'translate' ? 'Translate' : 'Send'}
                                    </Button>
                                </div>
                            )}

                            {/* Results */}
                            {textResult && (
                                <div className="mt-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs font-bold text-purple-400 uppercase">Result</h4>
                                        <button
                                            onClick={() => {
                                                const utterance = new SpeechSynthesisUtterance(textResult);
                                                speechSynthesis.speak(utterance);
                                            }}
                                            className="text-purple-400 hover:text-purple-300"
                                        >
                                            <Volume2 size={16} />
                                        </button>
                                    </div>
                                    <p className="text-gray-300 whitespace-pre-wrap">{textResult}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


