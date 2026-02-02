import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    // Allows for nested keys with dot notation
    keySeparator: '.',
    // Disable suspense mode for simpler usage
    react: {
      useSuspense: false,
    },
  });

export default i18n;
