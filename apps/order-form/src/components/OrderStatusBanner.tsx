import { useTranslation } from "react-i18next";

const WEBSITE_URL_HU = "https://lisztrapszodia.in.rs/index.html";
const WEBSITE_URL_RS = "https://lisztrapszodia.in.rs/index-rs.html";

interface OrderStatusBannerProps {
  show: boolean;
  /** The date the baker announced ordering reopens on (set when they closed ordering). */
  reopenDate?: Date;
  /** Optional message shown instead of the default reopen-date line, e.g. a holiday announcement. */
  holidayMessage?: string;
}

function formatDate(date: Date, isHun: boolean): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return isHun ? `${yyyy}.${mm}.${dd}.` : `${dd}.${mm}.${yyyy}.`;
}

export function OrderStatusBanner({ show, reopenDate, holidayMessage }: OrderStatusBannerProps) {
  const { t, i18n } = useTranslation();
  const isHun = i18n.language === "hu";
  const websiteUrl = i18n.language === "hu" ? WEBSITE_URL_HU : WEBSITE_URL_RS;

  if (!show) return null;

  return (
    <div className="bg-blue-50 border-2 border-blue-500 rounded-xl py-5 px-6 my-6 mx-auto max-w-[720px] text-left text-blue-900 font-light text-base leading-relaxed shadow-md">
      {holidayMessage ? (
        <div className="font-semibold text-lg">{holidayMessage}</div>
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
          className="text-blue-900 underline font-bold transition-opacity hover:opacity-80"
        >
          {t("our offer and learn about how we prepare our products")}
        </a>
        .
      </div>
    </div>
  );
}
