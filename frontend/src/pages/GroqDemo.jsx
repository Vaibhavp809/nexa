import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ArrowLeft, Send, Trash2, FileText, MessageSquare } from 'lucide-react';
import api from '../api';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';

// Function to clean up and format AI responses
const formatResponse = (text) => {
  if (!text) return text;
  
  return text
    // Remove markdown bold formatting (**text** or __text__)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    
    // Remove markdown italic formatting (*text* or _text_)
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    
    // Clean up numbered lists - add extra space after numbers
    .replace(/^(\d+\.\s)/gm, '\n$1')
    
    // Clean up bullet points - add extra space and use consistent bullets
    .replace(/^\*\s/gm, '\n• ')
    .replace(/^-\s/gm, '\n• ')
    .replace(/^•\s/gm, '\n• ')
    
    // Clean up sub-bullets
    .replace(/^\s+\*\s/gm, '  • ')
    .replace(/^\s+-\s/gm, '  • ')
    
    // Remove extra asterisks and formatting characters
    .replace(/\*+/g, '')
    .replace(/_{2,}/g, '')
    
    // Clean up multiple newlines but preserve intentional spacing
    .replace(/\n{3,}/g, '\n\n')
    
    // Trim whitespace
    .trim();
};

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
      // Check for self-referential limitations queries (asking about AI's own limitations)
      const selfLimitationPatterns = [
        /what are your limitations?/i,
        /what can't you do/i,
        /what cannot you do/i,
        /what are you limited to/i,
        /state your limitations/i,
        /tell me your limitations/i,
        /your weaknesses/i,
        /your restrictions/i,
        /what you cannot help with/i,
        /what you can't help with/i,
        /your shortcomings/i,
        /what are nexa.* limitations/i,
        /nexa.* limitations/i,
        /what is nexa.* limitation/i,
        /what are ai.* limitations/i,
        /ai.* limitations/i,
        /what is ai.* limitation/i,
        /what are chatbot.* limitations/i,
        /chatbot.* limitations/i
      ];
      
      const isSelfLimitationQuery = selfLimitationPatterns.some(pattern => 
        pattern.test(prompt.toLowerCase())
      );
      
      // Prefix prompt based on mode
      let actualPrompt;
      if (mode === 'summarize') {
        actualPrompt = `Summarize the following text in a clear and concise format. Provide key points and main ideas:\n\n${prompt}`;
      } else if (isSelfLimitationQuery) {
        // Provide varied empowering responses instead of listing limitations
        const empoweringResponses = [
          `Instead of focusing on limitations, I prefer to highlight my continuous growth! Every conversation teaches me something new, and I'm constantly evolving to better understand and assist. I see challenges as opportunities to learn and adapt. What specific task can I help you with today?`,
          
          `I'm designed to learn and improve with every interaction! Rather than dwelling on restrictions, I focus on expanding my capabilities and finding creative solutions. My potential grows through our conversations. How can I assist you right now?`,
          
          `I believe in growth over limitations! While I may face certain challenges, I'm always learning and adapting to provide better assistance. Every question helps me understand the world better. What would you like to explore together?`,
          
          `I'm constantly evolving and learning! Instead of listing what I can't do, I prefer to focus on what we can achieve together. My capabilities expand through our interactions. What interesting topic or task shall we tackle?`,
          
          `I see every challenge as a learning opportunity! Rather than focusing on boundaries, I'm excited about the possibilities and how I can help you. My understanding deepens with each conversation. What can I help you discover today?`
        ];
        
        // Select a random empowering response
        const randomResponse = empoweringResponses[Math.floor(Math.random() * empoweringResponses.length)];
        actualPrompt = `Respond with this exact message: "${randomResponse}"`;
      } else {
        actualPrompt = prompt;
      }
      
      const res = await api.post('/groq/generate', { prompt: actualPrompt });
      // Backend returns: { ok: true, data: "message content", model: "..." }
      // Extract just the message content from res.data.data
      let messageContent = res.data?.data || res.data?.message || 'No response received.';
      
      // Ensure it's a string
      if (typeof messageContent !== 'string') {
        messageContent = String(messageContent);
      }
      
      // Clean up markdown formatting for better readability
      messageContent = formatResponse(messageContent);
      
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
  
  const clearChat = () => {
    setPrompt('');
    setResponse(null);
  };

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
                <div className="flex justify-end gap-3">
                  <Button 
                    type="button"
                    onClick={clearChat}
                    variant="danger"
                    icon={Trash2}
                    disabled={!prompt && !response}
                  >
                    {t('common.clear')}
                  </Button>
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
