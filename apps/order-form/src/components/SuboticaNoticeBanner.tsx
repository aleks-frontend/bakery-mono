import { useTranslation } from "react-i18next";
import { SUBOTICA_DELIVERY_PAUSED } from "@/config/temporaryNotices";

export function SuboticaNoticeBanner() {
  const { t } = useTranslation();

  if (!SUBOTICA_DELIVERY_PAUSED) return null;

  return (
    <div className="bg-bakery-highlight-soft border border-bakery-highlight rounded-xl py-5 px-6 my-6 mx-auto max-w-[720px] text-left text-bakery-text font-light text-base leading-relaxed shadow-sm">
      <div className="font-serif font-semibold text-lg">
        {t(
          "No deliveries to Subotica this week — orders can only be picked up in person in Hajdukovo. 🚚"
        )}
      </div>
    </div>
  );
}
