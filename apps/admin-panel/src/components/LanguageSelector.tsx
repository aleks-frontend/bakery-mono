import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

const LANG_STORAGE_KEY = "bakery-admin-panel";

const LANGUAGES = [
  {
    code: "hu" as const,
    titleKey: "Hungarian" as const,
    flag: "https://flagcdn.com/w20/hu.png",
  },
  {
    code: "sr" as const,
    titleKey: "Serbian" as const,
    flag: "https://flagcdn.com/w20/rs.png",
  },
  {
    code: "en" as const,
    titleKey: "English" as const,
    flag: "https://flagcdn.com/w20/gb.png",
  },
] as const;

export function LanguageSelector() {
  const { i18n, t } = useTranslation();

  // Get initial language from localStorage or i18n
  const getInitialLanguage = (): string => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === "en" || saved === "sr" || saved === "hu") {
        return saved;
      }
    }
    const lang = i18n.resolvedLanguage || i18n.language || "en";
    return lang.split("-")[0]; // Handle locale codes like "en-US" -> "en"
  };

  const [currentLanguage, setCurrentLanguage] = useState<string>(() =>
    getInitialLanguage(),
  );

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      const langCode = lng.split("-")[0]; // Handle locale codes like "en-US" -> "en"
      setCurrentLanguage(langCode);
    };

    // Sync with i18n on mount
    const lang = i18n.resolvedLanguage || i18n.language || "en";
    const langCode = lang.split("-")[0];
    setCurrentLanguage(langCode);

    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLanguageChange = (code: "en" | "sr" | "hu") => {
    i18n.changeLanguage(code);
    setCurrentLanguage(code);
    if (typeof window !== "undefined") {
      localStorage.setItem(LANG_STORAGE_KEY, code);
    }
  };

  const isActive = (code: string) => {
    // Check both state and i18n to ensure accuracy
    const langFromI18n = (i18n.resolvedLanguage || i18n.language || "en").split(
      "-",
    )[0];
    const langFromStorage =
      typeof window !== "undefined"
        ? localStorage.getItem(LANG_STORAGE_KEY)
        : null;

    // Use storage if available, otherwise use i18n, otherwise use state
    const activeLang = langFromStorage || langFromI18n || currentLanguage;
    return activeLang === code;
  };

  return (
    <div className="flex gap-2">
      {LANGUAGES.map(({ code, titleKey, flag }) => {
        const active = isActive(code);
        return (
          <button
            key={code}
            type="button"
            title={t(titleKey)}
            onClick={() => handleLanguageChange(code)}
            className={`
            w-9 h-9 border-2 rounded-lg bg-bakery-card flex items-center justify-center
            transition-all duration-200 shadow-sm p-0
            hover:-translate-y-0.5 hover:shadow-md hover:border-bakery-primary
            md:w-9 md:h-9
            ${
              active
                ? "border-bakery-primary bg-[#C68642] shadow-[0_0_0_3px_rgba(198,134,66,0.2)]"
                : "border-bakery-border"
            }
          `}
          >
            <img
              src={flag}
              alt={t(titleKey)}
              className="w-5 h-[13px] object-cover rounded-sm block"
            />
          </button>
        );
      })}
    </div>
  );
}
