import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export interface ITranslationHook {
  t: (key: string, defaultValue?: string) => string;
  i18n: any;
  ready: boolean;
  language: string;
  changeLanguage: (lang: string) => Promise<void>;
  getCurrentLanguageLabel: () => string;
}

/**
 * Custom hook for translations with extended functionality
 * Usage: const { t, changeLanguage, language } = useTranslate();
 */
export function useTranslate(): ITranslationHook {
  const { t, i18n, ready } = useTranslation('translation');
  const [language, setLanguage] = useState(i18n.language);

  useEffect(() => {
    // Listen for language changes
    const handleLanguageChanged = (lng: string) => {
      setLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const changeLanguage = async (lang: string) => {
    try {
      console.log("Changing i18n language from", i18n.language, "to", lang);
      await i18n.changeLanguage(lang);
      localStorage.setItem('i18n_language', lang);
      setLanguage(lang);
      console.log("Language changed successfully to", lang);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const getCurrentLanguageLabel = () => {
    const labels: Record<string, string> = {
      en: 'English',
      hi: 'हिंदी',
      mr: 'मराठी',
    };
    return labels[language] || 'English';
  };

  return {
    t: (key: string, defaultValue?: string) => {
      const translated = t(key);
      return translated === key ? (defaultValue || key) : translated;
    },
    i18n,
    ready,
    language,
    changeLanguage,
    getCurrentLanguageLabel,
  };
}

/**
 * Get all available languages
 */
export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
] as const;

export type LanguageCode = typeof AVAILABLE_LANGUAGES[number]['code'];
