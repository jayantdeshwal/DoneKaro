import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import hi from './locales/hi.json'

// Ensure smooth language migration from legacy kaamgar-language to donekaro_language
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  try {
    const legacy = localStorage.getItem('kaamgar-language')
    if (legacy && !localStorage.getItem('donekaro_language')) {
      localStorage.setItem('donekaro_language', legacy)
    }
  } catch {}
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
    },
    fallbackLng: 'hi',
    supportedLngs: ['en', 'hi'],
    defaultNS: 'translation',
    ns: ['translation'],
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'donekaro_language',
    },
    
    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    },
    parseMissingKeyHandler: (key: string) => {
      const parts = key.split('.')
      const last = parts[parts.length - 1]
      return last
        .replace(/([A-Z])/g, ' $1')
        .replace(/[_-]/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase())
        .trim()
    },
  })

export default i18n