import { useTranslation } from "react-i18next";

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

  return (
    <div className="flex gap-2 z-[100]">
      {LANGUAGES.map(({ code, titleKey, flag }) => (
        <button
          key={code}
          type="button"
          title={t(titleKey)}
          onClick={() => i18n.changeLanguage(code)}
          className={`
            w-9 h-9 border-2 rounded-lg bg-bakery-card flex items-center justify-center
            transition-all duration-200 shadow-sm p-0
            hover:-translate-y-0.5 hover:shadow-md hover:border-bakery-primary
            md:w-9 md:h-9
            ${
              i18n.language === code
                ? "border-bakery-primary bg-bakery-primary shadow-[0_0_0_3px_rgba(198,134,66,0.2)]"
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
      ))}
    </div>
  );
}
