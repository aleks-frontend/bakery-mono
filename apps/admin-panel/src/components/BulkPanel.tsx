import { useTranslation } from "react-i18next"

interface BulkPanelProps {
  count: number
  children: React.ReactNode
}

export function BulkPanel({ count, children }: BulkPanelProps) {
  const { t } = useTranslation()

  if (count === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div className="flex w-full max-w-3xl flex-col gap-3 rounded-xl border-2 border-primary/35 bg-muted px-4 py-3.5 shadow-2xl shadow-black/20 ring-1 ring-black/[0.06] backdrop-blur-md dark:border-primary/45 dark:bg-muted/95 dark:shadow-black/40 dark:ring-white/10 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-sm font-semibold text-foreground whitespace-nowrap">
          {t("{{count}} selected", { count })}
        </p>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {children}
        </div>
      </div>
    </div>
  )
}
