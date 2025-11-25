import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Globe, Save } from 'lucide-react';
import { LANGUAGES } from '../../../backend/utils/languages'; // We'll need to move this or duplicate it

// Temporary duplicate of languages since we can't import from backend easily in frontend
const LANGS = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'mr', name: 'Marathi' },
    { code: 'kn', name: 'Kannada' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' }
];

export default function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        preferredLanguage: 'en',
        bio: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:4000/api/auth/profile', {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });
            setUser(response.data.user);
            setFormData({
                username: response.data.user.username,
                preferredLanguage: response.data.user.preferredLanguage || 'en',
                bio: response.data.user.bio || ''
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                'http://localhost:4000/api/auth/profile',
                formData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                }
            );
            setUser(response.data.user);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black text-white pt-24 flex justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 pt-24">
            <div className="max-w-2xl mx-auto bg-white/5 rounded-2xl p-8 border border-white/10">
                <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                    <User className="text-blue-500" />
                    Edit Profile
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email (Read-only) */}
                    <div>
                        <label className="block text-gray-400 mb-2 text-sm">Email Address</label>
                        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg text-gray-500 cursor-not-allowed">
                            <Mail size={18} />
                            {user?.email}
                        </div>
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-gray-400 mb-2 text-sm">Username</label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                            required
                        />
                    </div>

                    {/* Language */}
                    <div>
                        <label className="block text-gray-400 mb-2 text-sm">Preferred Language</label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                value={formData.preferredLanguage}
                                onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 pl-10 text-white focus:border-blue-500 outline-none appearance-none cursor-pointer"
                            >
                                {LANGS.map(lang => (
                                    <option key={lang.code} value={lang.code} className="bg-gray-900">
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-gray-400 mb-2 text-sm">Bio</label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none h-32 resize-none"
                            placeholder="Tell us about yourself..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : (
                            <>
                                <Save size={20} />
                                Save Changes
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
