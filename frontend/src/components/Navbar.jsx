import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, User, Settings, LogOut, MessageSquare, CheckSquare, Languages, Bell, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { t } = useTranslation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/', icon: Home, label: t('nav.home') },
        { path: '/notes', icon: FileText, label: t('nav.notes') },
        { path: '/tasks', icon: CheckSquare, label: t('nav.tasks') },
        { path: '/notifications', icon: Bell, label: t('nav.notifications') },
        { path: '/groq', icon: MessageSquare, label: t('nav.chat') },
        { path: '/meditator', icon: Languages, label: t('nav.meditator') },
        { path: '/profile', icon: User, label: t('nav.profile') },
        { path: '/settings', icon: Settings, label: t('nav.settings') },
    ];

    // Close sidebar when route changes
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    // Prevent body scroll when sidebar is open
    useEffect(() => {
        if (isSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isSidebarOpen]);

    const handleLogout = () => {
        logout();
        setIsSidebarOpen(false);
    };

    const handleNavClick = (path) => {
        navigate(path);
        setIsSidebarOpen(false);
    };

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-lg border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white">
                            N
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white hidden sm:inline">Nexa</span>
                    </Link>

                    {/* Desktop Navigation */}
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

                    {/* Desktop Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="hidden md:flex p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Sign Out"
                    >
                        <LogOut size={20} />
                    </button>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors touch-manipulation"
                        aria-label="Toggle menu"
                    >
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                        />

                        {/* Sidebar */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-black/95 backdrop-blur-xl border-r border-white/10 z-50 md:hidden flex flex-col shadow-2xl"
                        >
                            {/* Sidebar Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <Link to="/" className="flex items-center gap-2" onClick={() => setIsSidebarOpen(false)}>
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white">
                                        N
                                    </div>
                                    <span className="font-bold text-xl tracking-tight text-white">Nexa</span>
                                </Link>
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors touch-manipulation"
                                    aria-label="Close menu"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Navigation Items */}
                            <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.path);
                                    return (
                                        <button
                                            key={item.path}
                                            onClick={() => handleNavClick(item.path)}
                                            className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all touch-manipulation ${
                                                active
                                                    ? 'bg-white/10 text-white'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10'
                                            }`}
                                        >
                                            <Icon size={22} className="flex-shrink-0" />
                                            <span className="font-medium text-base">{item.label}</span>
                                            {active && (
                                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>

                            {/* Sidebar Footer - Logout */}
                            <div className="p-4 border-t border-white/10">
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-3 rounded-lg flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors touch-manipulation"
                                >
                                    <LogOut size={22} className="flex-shrink-0" />
                                    <span className="font-medium text-base">{t('settings.sections.account.signOut')}</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
