import { NavLink, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { LanguageSelector } from "./LanguageSelector"
import { BackendHealthBadge } from "./BackendHealthBadge"
import { Separator } from "./ui/separator"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"
import { useSession, signOut } from "@/lib/authClient"

export function Header() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: session } = useSession()

  async function handleSignOut() {
    await signOut()
    navigate("/login", { replace: true })
  }

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
            {session && (
              <>
                <nav className="flex items-center gap-1">
                  <NavLink to="/" end className={navLinkClass}>
                    {t("Orders")}
                  </NavLink>
                  <NavLink to="/articles" className={navLinkClass}>
                    {t("Articles")}
                  </NavLink>
                </nav>

                <BackendHealthBadge />

                <Separator orientation="vertical" className="h-6" />
              </>
            )}

            <LanguageSelector />

            {session && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <span className="text-sm text-muted-foreground">{session.user.name}</span>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  {t("Log out")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
