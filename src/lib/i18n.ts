import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enLng from '../locales/en.json';
import hiLng from '../locales/hi.json';
import mrLng from '../locales/mr.json';

const resources = {
  en: { translation: enLng },
  hi: { translation: hiLng },
  mr: { translation: mrLng },
};

// Get saved language preference or default to English
const getSavedLanguage = () => {
  try {
    const saved = localStorage.getItem('i18n_language');
    if (saved && ['en', 'hi', 'mr'].includes(saved)) {
      return saved;
    }
  } catch {
    // localStorage not available
  }
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    defaultNS: 'translation',
    ns: ['translation'],
    interpolation: {
      escapeValue: false, // react already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false, // Disable suspense for now
    },
  });

export default i18n;
