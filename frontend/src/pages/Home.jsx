import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, MessageSquare, User, ArrowRight, Zap, Shield, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6"
          >
            Nexa Intelligent Assistant
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-10"
          >
            Your all-in-one AI companion for productivity. Chat, summarize, translate, and take notes seamlessly across the web.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link to="/groq" className="px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-colors flex items-center gap-2">
              Start Chatting <ArrowRight size={20} />
            </Link>
            <Link to="/notes" className="px-8 py-3 rounded-full bg-white/10 text-white font-bold hover:bg-white/20 transition-colors border border-white/10">
              My Notes
            </Link>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <FeatureCard
            icon={MessageSquare}
            title="AI Chat"
            description="Powered by Groq for lightning-fast responses. Ask anything, anytime."
            link="/groq"
            color="text-blue-400"
          />
          <FeatureCard
            icon={FileText}
            title="Smart Notes"
            description="Capture ideas instantly. Organize with colors and pins. Syncs everywhere."
            link="/notes"
            color="text-purple-400"
          />
          <FeatureCard
            icon={Globe}
            title="Translation"
            description="Break language barriers. Translate text instantly in the extension."
            link="#"
            color="text-pink-400"
          />
        </div>

        {/* Extension Promo */}
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-3xl p-8 md:p-12 border border-white/10 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold mb-4">Get the Chrome Extension</h2>
              <p className="text-gray-400 mb-6">
                Bring Nexa to every webpage. Summarize articles, chat with AI, and take notes without leaving your current tab.
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Zap size={16} className="text-yellow-400" /> Fast
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Shield size={16} className="text-green-400" /> Secure
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <button className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors">
                Add to Chrome
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, link, color }) {
  return (
    <Link to={link} className="group p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all">
      <div className={`mb-4 p-3 rounded-xl bg-white/5 w-fit ${color}`}>
        <Icon size={32} />
      </div>
      <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </Link>
  );
}
