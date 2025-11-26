import React, { useState } from 'react';
import { Settings as SettingsIcon, LogOut, Moon, Sun, Bell, Bot, Globe, FileText, CheckSquare, User, Clock, Link as LinkIcon, Sparkles, Zap, CircleDot } from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { motion } from 'framer-motion';

export default function Settings() {
    const { logout } = useAuth();
    const [isBubbleEnabled, setIsBubbleEnabled] = useLocalStorage('nexa.bubble.enabled', true);
    const [language, setLanguage] = useLocalStorage('nexa.preferredLanguage', 'en');
    const [bubbleIcon, setBubbleIcon] = useLocalStorage('nexa.bubble.icon', 'bot');

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'Hindi' },
        { code: 'mr', name: 'Marathi' },
        { code: 'kn', name: 'Kannada' },
    ];

    const handleBubbleToggle = () => {
        setIsBubbleEnabled(!isBubbleEnabled);
        setTimeout(() => window.location.reload(), 300);
    };

    return (
        <div className="min-h-screen bg-black text-white pt-28 pb-12 px-6 md:px-12">
            <div className="max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            Settings
                        </h1>
                    </div>
                    <p className="text-gray-400 ml-0">Manage your preferences and account</p>
                </motion.div>

                <div className="space-y-6">
                    {/* Bubble Section */}
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                        <h2 className="text-xl font-semibold mb-4 text-gray-200 flex items-center gap-2">
                            <Bot size={20} className="text-blue-400" />
                            Floating Bubble
                        </h2>
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                                <span>Enable Bubble</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isBubbleEnabled}
                                    onChange={handleBubbleToggle}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            Changes will reload the page to apply.
                        </p>
                    </div>

                    {/* Bubble Theme Section */}
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                        <h2 className="text-xl font-semibold mb-4 text-gray-200 flex items-center gap-2">
                            <Bot size={20} className="text-blue-400" />
                            Bubble Theme
                        </h2>
                        <div className="py-3">
                            <p className="text-sm text-gray-400 mb-4">Choose your bubble icon:</p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'bot', icon: Bot, label: 'Bot', color: 'text-blue-400' },
                                    { id: 'sparkles', icon: Sparkles, label: 'Sparkles', color: 'text-purple-400' },
                                    { id: 'zap', icon: Zap, label: 'Zap', color: 'text-yellow-400' },
                                    { id: 'circle', icon: CircleDot, label: 'Circle', color: 'text-green-400' },
                                ].map(({ id, icon: Icon, label, color }) => (
                                    <button
                                        key={id}
                                        onClick={() => setBubbleIcon(id)}
                                        className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                                            bubbleIcon === id
                                                ? 'border-neon-blue bg-neon-blue/10'
                                                : 'border-white/10 hover:border-white/20'
                                        }`}
                                    >
                                        <Icon className={clsx("w-8 h-8", color)} />
                                        <span className="text-sm text-gray-300">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Appearance Section */}
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                        <h2 className="text-xl font-semibold mb-4 text-gray-200 flex items-center gap-2">
                            <Globe size={20} className="text-purple-400" />
                            Language
                        </h2>
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                                <span>Preferred Language</span>
                            </div>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="bg-black/20 border border-white/10 rounded px-3 py-1 text-sm text-white"
                                style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                            >
                                {languages.map(lang => (
                                    <option key={lang.code} value={lang.code} style={{ backgroundColor: '#111827', color: '#ffffff' }}>{lang.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Notifications Section */}
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                        <h2 className="text-xl font-semibold mb-4 text-gray-200">Notifications</h2>
                        <div className="flex items-center justify-between py-3 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <Bell size={20} className="text-yellow-400" />
                                <span>Email Notifications</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>

                    {/* Navigation Section */}
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                        <h2 className="text-xl font-semibold mb-4 text-gray-200 flex items-center gap-2">
                            <LinkIcon size={20} className="text-green-400" />
                            Quick Links
                        </h2>
                        <div className="space-y-2">
                            <Link
                                to="/notes"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                            >
                                <FileText size={20} className="text-blue-400" />
                                <span className="flex-1">Notes</span>
                                <span className="text-gray-500 group-hover:text-white">→</span>
                            </Link>
                            <Link
                                to="/tasks"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                            >
                                <CheckSquare size={20} className="text-purple-400" />
                                <span className="flex-1">Tasks</span>
                                <span className="text-gray-500 group-hover:text-white">→</span>
                            </Link>
                            <Link
                                to="/profile"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                            >
                                <User size={20} className="text-pink-400" />
                                <span className="flex-1">Profile</span>
                                <span className="text-gray-500 group-hover:text-white">→</span>
                            </Link>
                            <Link
                                to="/history"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                            >
                                <Clock size={20} className="text-yellow-400" />
                                <span className="flex-1">History</span>
                                <span className="text-gray-500 group-hover:text-white">→</span>
                            </Link>
                        </div>
                    </div>

                    {/* Account Section */}
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                        <h2 className="text-xl font-semibold mb-4 text-gray-200">Account</h2>
                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                            <LogOut size={20} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
