import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language } from '@kaamgar/shared'
import i18n from '@/i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const LANGUAGE_STORAGE_KEY = 'donekaro_language'
const LEGACY_LANGUAGE_STORAGE_KEY = 'kaamgar-language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = (localStorage.getItem(LANGUAGE_STORAGE_KEY) || localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY)) as Language
      if (saved && (saved === 'en' || saved === 'hi')) return saved
      return (i18n.language === 'en' ? 'en' : 'hi') as Language
    }
    return 'hi'
  })
  
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
    localStorage.setItem(LEGACY_LANGUAGE_STORAGE_KEY, lang)
    document.documentElement.lang = lang
    void i18n.changeLanguage(lang)
  }
  
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en')
  }
  
  useEffect(() => {
    document.documentElement.lang = language
    if (i18n.language !== language) {
      void i18n.changeLanguage(language)
    }
  }, [language])
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}