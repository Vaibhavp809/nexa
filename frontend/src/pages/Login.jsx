import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { Button } from '../ui/Button';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import api from '../api';
import { useTranslation } from '../hooks/useTranslation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await login(email, password);
      // Check if onboarding is completed
      const onboardingCompleted = localStorage.getItem('nexa.onboarding.completed');
      const languageSelected = localStorage.getItem('nexa.language.selected');
      
      if (!languageSelected) {
        navigate('/language-selection');
      } else if (!onboardingCompleted) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetCode = async () => {
    if (!forgotPasswordEmail) {
      setError('Please enter your email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotPasswordEmail });
      setCodeSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode || !newPassword) {
      setError('Please enter the code and new password');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: forgotPasswordEmail,
        code: resetCode,
        newPassword: newPassword
      });
      setShowForgotPassword(false);
      setCodeSent(false);
      setResetCode('');
      setNewPassword('');
      setError('');
      alert('Password reset successful! Please login with your new password.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Invalid code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 shadow-lg overflow-visible">
        <h2 className="text-4xl font-bold text-center mb-2 heading-gradient leading-tight py-1 overflow-visible">
          {t('auth.login.title')}
        </h2>
        <p className="text-center text-gray-400 mb-8">{t('auth.login.subtitle')}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('auth.login.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('auth.login.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-blue-400 hover:text-purple-400 transition-colors"
            >
              {t('auth.login.forgotPassword')}
            </button>
          </div>

          <Button type="submit" className="w-full" isLoading={loading} icon={LogIn}>
            {t('auth.login.signIn')}
          </Button>
        </form>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Reset Password</h3>
              
              {!codeSent ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Enter your registered email</label>
                    <input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="input-field"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="flex-1"
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSendResetCode}
                      isLoading={loading}
                      className="flex-1"
                    >
                      Send Code
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Enter the code sent to your email</label>
                    <input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="input-field"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-field pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setCodeSent(false);
                        setResetCode('');
                        setNewPassword('');
                      }}
                      className="flex-1"
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleResetPassword}
                      isLoading={loading}
                      className="flex-1"
                    >
                      Reset Password
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            {t('auth.login.noAccount')}{' '}
            <Link to="/register" className="text-blue-400 hover:text-purple-400 transition-colors font-semibold">
              {t('auth.login.signUp')}
            </Link>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-xs text-center text-gray-500 uppercase tracking-wider mb-4">Or sign in with</p>
          <div className="flex gap-4 justify-center">
            {/* Placeholders for social login */}
            <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">G</button>
            <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">T</button>
            <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">F</button>
          </div>
        </div>
      </div>
    </div>
  );
}
