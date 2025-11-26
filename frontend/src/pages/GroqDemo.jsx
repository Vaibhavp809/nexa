import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ArrowLeft, Send, Trash2, FileText, MessageSquare } from 'lucide-react';
import api from '../api';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';

export default function GroqDemo() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('chat'); // 'chat' or 'summarize'
  const [history, setHistory] = useLocalStorage('nexa.groqHistory', []);
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      // Prefix prompt based on mode
      const actualPrompt = mode === 'summarize' 
        ? `Summarize the following text in a clear and concise format. Provide key points and main ideas:\n\n${prompt}`
        : prompt;
      
      const res = await api.post('/groq/generate', { prompt: actualPrompt });
      // Backend returns: { ok: true, data: "message content", model: "..." }
      // Extract just the message content from res.data.data
      let messageContent = res.data?.data || res.data?.message || 'No response received.';
      
      // Ensure it's a string
      if (typeof messageContent !== 'string') {
        messageContent = String(messageContent);
      }
      
      setResponse(messageContent);
      setHistory(prev => [{ prompt, response: messageContent, mode, timestamp: new Date().toISOString() }, ...prev]);
    } catch (err) {
      console.error(err);
      setResponse('Failed to fetch response');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => setHistory([]);

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 overflow-visible"
        >
          <div className="flex items-start gap-4 mb-4 overflow-visible">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors mt-1">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold heading-gradient leading-tight py-1 overflow-visible">
              {t('pages.chat.title')}
            </h1>
          </div>
          <p className="text-gray-400 ml-10">{t('pages.chat.subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Interaction Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mode Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex gap-4 p-1 bg-white/5 rounded-xl border border-white/10"
            >
              <button
                onClick={() => setMode('chat')}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  mode === 'chat'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <MessageSquare size={20} />
                {t('nav.chat')}
              </button>
              <button
                onClick={() => setMode('summarize')}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  mode === 'summarize'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <FileText size={20} />
                {t('pages.chat.summarize')}
              </button>
            </motion.div>

            {/* Input Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block text-sm font-medium text-gray-300">
                  {mode === 'summarize' ? t('pages.chat.pasteText') : t('pages.chat.enterMessage')}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  style={{ minHeight: '200px' }}
                  placeholder={mode === 'summarize' 
                    ? t('pages.chat.pasteText') + '...' 
                    : t('pages.chat.enterMessage') + '...'}
                />
                <div className="flex justify-end">
                  <Button type="submit" isLoading={loading} icon={Send}>
                    {mode === 'summarize' ? t('pages.chat.summarize') : t('common.send')}
                  </Button>
                </div>
              </form>
            </motion.div>

            {/* Response */}
            {response && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <h3 className="text-lg font-bold mb-4 heading-gradient leading-tight py-1">
                  {mode === 'summarize' ? t('pages.chat.summary') : t('pages.chat.response')}
                </h3>
                <div className="bg-black/30 p-4 rounded-lg">
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {response}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* History Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-300">{t('pages.chat.history')}</h3>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory} 
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> {t('common.clear')}
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
              {history.map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                  onClick={() => {
                    setPrompt(item.prompt);
                    setResponse(item.response);
                    setMode(item.mode || 'chat');
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {item.mode === 'summarize' ? (
                      <FileText size={14} className="text-purple-400" />
                    ) : (
                      <MessageSquare size={14} className="text-blue-400" />
                    )}
                    <span className="text-xs font-semibold text-gray-400 uppercase">
                      {item.mode === 'summarize' ? t('pages.chat.summary') : t('nav.chat')}
                    </span>
                  </div>
                  <p className="font-medium text-white truncate mb-1 text-sm">{item.prompt.substring(0, 50)}{item.prompt.length > 50 ? '...' : ''}</p>
                  <p className="text-gray-500 text-xs truncate">{item.response.substring(0, 60)}{item.response.length > 60 ? '...' : ''}</p>
                  <p className="text-gray-600 text-[10px] mt-2 text-right">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-gray-500 text-sm italic text-center py-8">{t('pages.chat.noHistory')}</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
