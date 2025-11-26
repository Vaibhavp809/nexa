import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, User, Settings, LogOut, MessageSquare, CheckSquare, Languages, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
    const location = useLocation();
    const { logout } = useAuth();

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/notes', icon: FileText, label: 'Notes' },
        { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
        { path: '/notifications', icon: Bell, label: 'Notifications' },
        { path: '/groq', icon: MessageSquare, label: 'Chat' },
        { path: '/meditator', icon: Languages, label: 'Meditator' },
        { path: '/profile', icon: User, label: 'Profile' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-lg border-b border-white/10">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white">
                        N
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white">Nexa</span>
                </Link>

                <div className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${isActive(item.path)
                                    ? 'bg-white/10 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <item.icon size={18} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </div>

                <button
                    onClick={logout}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Sign Out"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </nav>
    );
}
