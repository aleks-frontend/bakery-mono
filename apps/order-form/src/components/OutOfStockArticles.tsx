import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PublicArticle } from "@bakery/api-client";

const ORDERS_EMAIL = "order@lisztrapszodia.in.rs";

interface OutOfStockArticlesProps {
  articles: PublicArticle[];
}

export function OutOfStockArticles({ articles }: OutOfStockArticlesProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  if (articles.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="text-sm font-medium text-bakery-text/70 underline decoration-dotted underline-offset-2 hover:text-bakery-text"
      >
        {open ? t("Hide unavailable products") : t("Don't see what you're looking for?")}
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-bakery-border bg-bakery-bg-soft py-2.5 px-3">
          <div className="flex items-center gap-1.5 text-sm text-bakery-text/70">
            <span>{t("These products aren't available right now:")}</span>
            <button
              type="button"
              onClick={() => setInfoOpen((o) => !o)}
              aria-expanded={infoOpen}
              aria-label={t("More information")}
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-bakery-text/40 text-[10px] font-semibold leading-none text-bakery-text/60 hover:border-bakery-text/70 hover:text-bakery-text"
            >
              i
            </button>
          </div>
          {infoOpen && (
            <p className="mt-1.5 text-xs text-bakery-text/60">
              {t("These may become available again in a future cycle.")}{" "}
              {t("Want to know when, or looking for something similar?")}{" "}
              <a
                href={`mailto:${ORDERS_EMAIL}`}
                className="font-medium text-bakery-primary underline hover:opacity-80"
              >
                {t("Email us")}
              </a>
              .
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {articles.map((article) => (
              <span
                key={article.id}
                className="rounded-full border border-bakery-border bg-white/60 px-2.5 py-1 text-xs text-bakery-text/60"
              >
                {article.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
