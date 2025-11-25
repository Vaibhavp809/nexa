import React from 'react';
import { Settings as SettingsIcon, LogOut, Moon, Sun, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
    const { logout } = useAuth();

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 pt-24">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                    <SettingsIcon className="text-purple-500" />
                    Settings
                </h1>

                <div className="space-y-6">
                    {/* Appearance Section */}
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                        <h2 className="text-xl font-semibold mb-4 text-gray-200">Appearance</h2>
                        <div className="flex items-center justify-between py-3 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <Moon size={20} className="text-blue-400" />
                                <span>Dark Mode</span>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium">
                                Always On
                            </div>
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
