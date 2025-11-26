import React, { useState, useEffect } from 'react';
import api from '../api';
import { User, Mail, Globe, Save, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';

// Temporary duplicate of languages since we can't import from backend easily in frontend
const LANGS = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'mr', name: 'Marathi' },
    { code: 'kn', name: 'Kannada' }
];

export default function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        preferredLanguage: 'en'
    });
    
    // Password change state
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');


    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/profile');
            setUser(response.data.user);
            setFormData({
                username: response.data.user.username,
                email: response.data.user.email,
                preferredLanguage: response.data.user.preferredLanguage || 'en'
            });
            
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchProfile();
    }, []);
    
    useEffect(() => {
        if (showChangePassword && user) {
            // Fetch security question when user opens change password section
            const fetchSecurityQuestion = async () => {
                try {
                    const sqResponse = await api.get('/auth/security-question');
                    setSecurityQuestion(sqResponse.data.securityQuestion);
                } catch (error) {
                    console.error('Error fetching security question:', error);
                }
            };
            fetchSecurityQuestion();
        }
    }, [showChangePassword]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await api.put('/auth/profile', formData);
            setUser(response.data.user);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };
    
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError('');
        
        if (!securityAnswer.trim()) {
            setPasswordError('Please enter your security answer');
            return;
        }
        
        if (!newPassword || !confirmNewPassword) {
            setPasswordError('Please enter both new password and confirmation');
            return;
        }
        
        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }
        
        if (newPassword !== confirmNewPassword) {
            setPasswordError('Passwords do not match');
            return;
        }
        
        setChangingPassword(true);
        try {
            await api.post('/auth/change-password', {
                securityAnswer: securityAnswer.trim(),
                newPassword
            });
            alert('Password changed successfully!');
            setShowChangePassword(false);
            setSecurityAnswer('');
            setNewPassword('');
            setConfirmNewPassword('');
            setPasswordError('');
        } catch (error) {
            console.error('Error changing password:', error);
            setPasswordError(error.response?.data?.message || 'Failed to change password. Please check your security answer.');
        } finally {
            setChangingPassword(false);
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
                    {/* Email (Editable) */}
                    <div>
                        <label className="block text-gray-400 mb-2 text-sm flex items-center gap-2">
                            <Mail size={18} />
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Your email is used as your User ID</p>
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-gray-400 mb-2 text-sm flex items-center gap-2">
                            <User size={18} />
                            Username
                        </label>
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
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 pl-10 text-white focus:border-blue-500 outline-none appearance-none cursor-pointer"
                                style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                            >
                                {LANGS.map(lang => (
                                    <option key={lang.code} value={lang.code} style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={saving}
                        isLoading={saving}
                        className="w-full"
                        icon={Save}
                    >
                        Save Changes
                    </Button>
                </form>
                
                {/* Change Password Section */}
                <div className="mt-8 pt-8 border-t border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Lock className="text-purple-400" size={20} />
                            Change Password
                        </h2>
                        <button
                            onClick={() => {
                                setShowChangePassword(!showChangePassword);
                                if (!showChangePassword) {
                                    fetchProfile();
                                } else {
                                    setSecurityAnswer('');
                                    setNewPassword('');
                                    setConfirmNewPassword('');
                                    setPasswordError('');
                                }
                            }}
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            {showChangePassword ? 'Cancel' : 'Change Password'}
                        </button>
                    </div>
                    
                    {showChangePassword && (
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            {securityQuestion && (
                                <div>
                                    <label className="block text-gray-400 mb-2 text-sm">Security Question</label>
                                    <div className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-gray-300">
                                        {securityQuestion}
                                    </div>
                                </div>
                            )}
                            
                            <div>
                                <label className="block text-gray-400 mb-2 text-sm">Security Answer</label>
                                <input
                                    type="text"
                                    value={securityAnswer}
                                    onChange={(e) => setSecurityAnswer(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                                    placeholder="Enter your security answer"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-400 mb-2 text-sm">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 pr-10 text-white focus:border-blue-500 outline-none transition-colors"
                                        placeholder="Enter new password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-gray-400 mb-2 text-sm">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmNewPassword ? 'text' : 'password'}
                                        value={confirmNewPassword}
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 pr-10 text-white focus:border-blue-500 outline-none transition-colors"
                                        placeholder="Confirm new password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        {showConfirmNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {confirmNewPassword && newPassword !== confirmNewPassword && (
                                    <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                                )}
                            </div>
                            
                            {passwordError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm">
                                    {passwordError}
                                </div>
                            )}
                            
                            <Button
                                type="submit"
                                disabled={changingPassword}
                                isLoading={changingPassword}
                                className="w-full"
                                icon={Lock}
                            >
                                Change Password
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
