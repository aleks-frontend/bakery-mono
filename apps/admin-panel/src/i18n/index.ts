import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import enTranslations from "./en.json"
import huTranslations from "./hu.json"
import srTranslations from "./sr.json"

const LANG_STORAGE_KEY = "bakery-admin-panel"

const savedLang =
  typeof window !== "undefined" ? localStorage.getItem(LANG_STORAGE_KEY) : null
const initialLang =
  savedLang === "en" || savedLang === "sr" || savedLang === "hu"
    ? savedLang
    : "en"

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    sr: { translation: srTranslations },
    hu: { translation: huTranslations },
  },
  lng: initialLang,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
