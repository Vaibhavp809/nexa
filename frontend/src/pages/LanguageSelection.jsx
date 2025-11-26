import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../api';
import { useAuth } from '../hooks/useAuth';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
];

export default function LanguageSelection() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleContinue = async () => {
    setLoading(true);
    try {
      // Update user's preferred language
      await api.put('/auth/profile', { preferredLanguage: selectedLanguage });
      localStorage.setItem('nexa.language.selected', 'true');
      navigate('/onboarding');
    } catch (err) {
      console.error('Error updating language:', err);
      // Still continue even if update fails
      localStorage.setItem('nexa.language.selected', 'true');
      navigate('/onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-black">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-blue-500/20 mb-4">
            <Globe className="text-blue-400" size={48} />
          </div>
          <h1 className="text-3xl font-bold mb-2 heading-gradient leading-tight py-1">
            {user?.username ? `Welcome ${user.username}!` : 'Welcome to Nexa'}
          </h1>
          <p className="text-gray-400">Select your preferred language</p>
        </div>

        <div className="glass-card p-6 space-y-4">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLanguage(lang.code)}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                selectedLanguage === lang.code
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 hover:border-white/20 bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{lang.name}</p>
                  <p className="text-sm text-gray-400">{lang.nativeName}</p>
                </div>
                {selectedLanguage === lang.code && (
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </button>
          ))}

          <Button
            onClick={handleContinue}
            isLoading={loading}
            className="w-full mt-6"
            icon={ArrowRight}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}


