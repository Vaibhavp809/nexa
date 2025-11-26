import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ArrowLeft, Send, Trash2 } from 'lucide-react';
import api from '../api';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function GroqDemo() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useLocalStorage('nexa.groqHistory', []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const res = await api.post('/groq/generate', { prompt });
      // Backend returns: { ok: true, data: "message content", model: "..." }
      // Extract just the message content from res.data.data
      const messageContent = res.data?.data || res.data?.message || 'No response received.';
      setResponse(messageContent);
      setHistory(prev => [{ prompt, response: messageContent, timestamp: new Date().toISOString() }, ...prev]);
    } catch (err) {
      console.error(err);
      setResponse('Failed to fetch response');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => setHistory([]);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/">
            <Button variant="ghost" icon={ArrowLeft}>Back to Home</Button>
          </Link>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-violet">
            Groq API Demo
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Interaction Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block text-sm font-medium text-gray-300">Enter Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="input-field h-32 resize-none"
                  placeholder="Explain quantum computing in simple terms..."
                />
                <div className="flex justify-end">
                  <Button type="submit" isLoading={loading} icon={Send}>
                    Generate
                  </Button>
                </div>
              </form>
            </div>

            {response && (
              <div className="glass-card p-6 border-neon-blue/30">
                <h3 className="text-lg font-bold mb-4 text-neon-blue">Response</h3>
                <div className="bg-black/30 p-4 rounded-lg overflow-x-auto">
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">
                    {response}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* History Sidebar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-300">History</h3>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
              {history.map((item, i) => (
                <div key={i} className="glass-card p-3 text-sm hover:bg-white/5 transition-colors cursor-pointer" onClick={() => {
                  setPrompt(item.prompt);
                  setResponse(item.response);
                }}>
                  <p className="font-medium text-white truncate mb-1">{item.prompt}</p>
                  <p className="text-gray-500 text-xs truncate">{item.response}</p>
                  <p className="text-gray-600 text-[10px] mt-2 text-right">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-gray-500 text-sm italic">No history yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
