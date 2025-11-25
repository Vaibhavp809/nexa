import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Button } from '../ui/Button';
import Bubble from '../components/Bubble/Bubble';
import { LogOut, Settings, MessageSquare, Zap } from 'lucide-react';

export default function Home() {
  const { user, logout } = useAuth();
  const [showBubble, setShowBubble] = useLocalStorage('nexa.showBubble', true);

  return (
    <div className="min-h-screen p-8">
      <nav className="flex justify-between items-center mb-12">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-violet">
          Nexa Auth
        </h1>
        <Button variant="ghost" onClick={logout} icon={LogOut}>
          Logout
        </Button>
      </nav>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* User Card */}
        <div className="glass-card p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="w-32 h-32 text-neon-blue" />
          </div>

          <h2 className="text-3xl font-bold mb-2">Hello, {user?.username || 'User'}!</h2>
          <p className="text-gray-400 mb-6">Welcome to your personal AI dashboard.</p>

          <div className="flex flex-wrap gap-4">
            <Link to="/groq">
              <Button icon={MessageSquare}>Try Groq Demo</Button>
            </Link>
            <Button variant="secondary" icon={Settings}>Account Settings</Button>
          </div>
        </div>

        {/* Settings / Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BotIcon /> Nexa Bubble
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Your floating AI assistant. Drag it anywhere, expand for quick actions.
            </p>
            <div className="flex items-center justify-between bg-black/20 p-3 rounded-lg">
              <span className="text-sm font-medium">Enable Bubble</span>
              <button
                onClick={() => setShowBubble(!showBubble)}
                className={`w-12 h-6 rounded-full transition-colors relative ${showBubble ? 'bg-neon-blue' : 'bg-gray-600'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${showBubble ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-neon-violet">0</div>
                <div className="text-xs text-gray-500">Chats</div>
              </div>
              <div className="bg-black/20 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-neon-blue">0</div>
                <div className="text-xs text-gray-500">Summaries</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBubble && <Bubble />}
    </div>
  );
}

function BotIcon() {
  return (
    <svg className="w-6 h-6 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
