import { NavLink, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { LanguageSelector } from "./LanguageSelector"
import { Separator } from "./ui/separator"
import { cn } from "@/lib/utils"

export function Header() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "px-3 py-1 text-sm transition-colors",
      isActive
        ? "font-semibold text-foreground border-b-2 border-primary"
        : "text-muted-foreground hover:text-foreground"
    )

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-4 text-left"
          >
            <img src="/logo.png" alt={t("Logo")} className="h-16 w-auto" />
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold">{t("LISZT: RAPSZÓDIA")}</h1>
              <p className="text-sm text-muted-foreground">{t("Hleb / Pecivo / Pica")}</p>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-1">
              <NavLink to="/" end className={navLinkClass}>
                {t("Orders")}
              </NavLink>
              <NavLink to="/bread-types" className={navLinkClass}>
                {t("Bread Types")}
              </NavLink>
            </nav>

            <Separator orientation="vertical" className="h-6" />

            <LanguageSelector />
          </div>
        </div>
      </div>
    </header>
  )
}
