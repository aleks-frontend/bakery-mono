import { useTranslation } from "react-i18next";

const WEBSITE_URL_HU = "https://lisztrapszodia.in.rs/index.html";
const WEBSITE_URL_RS = "https://lisztrapszodia.in.rs/index-rs.html";

interface HolidayMessageByLocale {
  en: string | null;
  sr: string | null;
  hu: string | null;
}

interface OrderStatusBannerProps {
  show: boolean;
  /** The date the baker announced ordering reopens on (set when they closed ordering). */
  reopenDate?: Date;
  /** Optional per-locale message shown instead of the default reopen-date line, e.g. a holiday announcement. */
  holidayMessage?: HolidayMessageByLocale;
}

function formatDate(date: Date, isHun: boolean): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return isHun ? `${yyyy}.${mm}.${dd}.` : `${dd}.${mm}.${yyyy}.`;
}

/** Resolves the message for the customer's current locale, falling back to English if that locale wasn't filled in. */
function resolveHolidayMessage(holidayMessage: HolidayMessageByLocale | undefined, language: string): string | null {
  if (!holidayMessage) return null;
  const localeMessage = language === "hu" ? holidayMessage.hu : language === "sr" ? holidayMessage.sr : holidayMessage.en;
  return localeMessage ?? holidayMessage.en ?? null;
}

export function OrderStatusBanner({ show, reopenDate, holidayMessage }: OrderStatusBannerProps) {
  const { t, i18n } = useTranslation();
  const isHun = i18n.language === "hu";
  const websiteUrl = i18n.language === "hu" ? WEBSITE_URL_HU : WEBSITE_URL_RS;
  const resolvedHolidayMessage = resolveHolidayMessage(holidayMessage, i18n.language);

  if (!show) return null;

  return (
    <div className="bg-bakery-highlight-soft border border-bakery-highlight rounded-xl py-5 px-6 my-6 mx-auto max-w-[720px] text-left text-bakery-text font-light text-base leading-relaxed shadow-sm">
      {resolvedHolidayMessage ? (
        <div className="font-serif font-semibold text-lg">{resolvedHolidayMessage}</div>
      ) : (
        <div>
          {reopenDate
            ? t("New orders will be available from {{date}} 💛", { date: formatDate(reopenDate, isHun) })
            : t("Ordering is currently closed.")}
        </div>
      )}
      <div className="mt-3">
        {t("Until then, check out")}{" "}
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-bakery-primary underline font-bold transition-opacity hover:opacity-80"
        >
          {t("our offer and learn about how we prepare our products")}
        </a>
        .
      </div>
    </div>
  );
}
