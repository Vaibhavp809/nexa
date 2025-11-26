import { useState, useEffect, createContext, useContext } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { getTranslation } from '../utils/translations';
import api from '../api';

const TranslationContext = createContext();

export function TranslationProvider({ children }) {
    const [language, setLanguage] = useLocalStorage('nexa.preferredLanguage', 'en');
    const [userLanguage, setUserLanguage] = useState(null);

    // Fetch user's preferred language from backend on mount
    useEffect(() => {
        const fetchUserLanguage = async () => {
            try {
                const response = await api.get('/auth/profile');
                const preferredLang = response.data?.user?.preferredLanguage || 'en';
                setUserLanguage(preferredLang);
                if (preferredLang !== language) {
                    setLanguage(preferredLang);
                }
            } catch (err) {
                // If not logged in or error, use localStorage value
                console.log('Using localStorage language preference');
            }
        };
        fetchUserLanguage();
    }, []);

    // Sync with backend when language changes
    const changeLanguage = async (newLang) => {
        setLanguage(newLang);
        try {
            await api.put('/auth/profile', { preferredLanguage: newLang });
        } catch (err) {
            console.error('Error updating language preference:', err);
        }
    };

    const t = (key) => {
        return getTranslation(language, key);
    };

    return (
        <TranslationContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
            {children}
        </TranslationContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(TranslationContext);
    if (!context) {
        // Fallback if not in provider
        const [language] = useLocalStorage('nexa.preferredLanguage', 'en');
        return {
            language,
            setLanguage: () => {},
            t: (key) => getTranslation(language, key),
        };
    }
    return context;
}

