import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import sr from './sr.json'
import hu from './hu.json'

const LANG_STORAGE_KEY = 'bakery-lang'

const savedLang =
  typeof window !== 'undefined' ? localStorage.getItem(LANG_STORAGE_KEY) : null
const initialLang =
  savedLang === 'en' || savedLang === 'sr' || savedLang === 'hu'
    ? savedLang
    : 'en'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    sr: { translation: sr },
    hu: { translation: hu },
  },
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', (lng: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANG_STORAGE_KEY, lng)
    document.documentElement.lang = lng
    document.title = i18n.t('Bakery Order')
  }
})

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLang
  document.title = i18n.t('Bakery Order')
}

export default i18n
