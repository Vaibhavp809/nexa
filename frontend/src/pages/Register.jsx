import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { Button } from '../ui/Button';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { SECURITY_QUESTIONS } from '../utils/securityQuestions';
import { useTranslation } from '../hooks/useTranslation';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!termsAccepted) {
      setError('Please accept the terms and conditions');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (!securityQuestion) {
      setError('Please select a security question');
      return;
    }
    
    if (!securityAnswer.trim()) {
      setError('Please provide an answer to the security question');
      return;
    }
    
    setLoading(true);
    try {
      await register(username, email, password, securityQuestion, securityAnswer);
      navigate('/language-selection');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 shadow-lg overflow-visible">
        <h2 className="text-4xl font-bold text-center mb-2 heading-gradient leading-tight py-1 overflow-visible">
          {t('auth.register.title')}
        </h2>
        <p className="text-center text-gray-400 mb-8">{t('auth.register.subtitle')}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('auth.register.username')}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              placeholder="johndoe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('auth.register.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{t('auth.register.emailHint')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('auth.register.password')}</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('auth.register.confirmPassword')}</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('auth.register.securityQuestion')}</label>
            <select
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
              className="input-field bg-black/20 text-white"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
              required
            >
              <option value="" style={{ backgroundColor: '#111827', color: '#ffffff' }}>{t('auth.register.securityQuestion')}...</option>
              {SECURITY_QUESTIONS.map((question, index) => (
                <option key={index} value={question} style={{ backgroundColor: '#111827', color: '#ffffff' }}>{question}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">This will be used to verify your identity for password changes</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('auth.register.securityAnswer')}</label>
            <input
              type="text"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              className="input-field"
              placeholder={t('auth.register.securityAnswer')}
              required
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-white/20 bg-black/20 text-neon-blue focus:ring-neon-blue"
              required
            />
            <label htmlFor="terms" className="text-sm text-gray-300 cursor-pointer">
              {t('auth.register.terms')}
            </label>
          </div>

          <Button type="submit" className="w-full" variant="primary" isLoading={loading} icon={UserPlus}>
            {t('auth.register.signUp')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            {t('auth.register.haveAccount')}{' '}
            <Link to="/login" className="text-blue-400 hover:text-purple-400 transition-colors font-semibold">
              {t('auth.register.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
