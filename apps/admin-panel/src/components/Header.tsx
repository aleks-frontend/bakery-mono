import { NavLink, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import { Menu } from "lucide-react"
import { LanguageSelector } from "./LanguageSelector"
import { BackendHealthBadge } from "./BackendHealthBadge"
import { Separator } from "./ui/separator"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useSession, signOut } from "@/lib/authClient"

const NAV_ITEMS = [
  { to: "/dashboard", end: false, labelKey: "Dashboard" },
  { to: "/", end: true, labelKey: "Orders" },
  { to: "/articles", end: false, labelKey: "Articles" },
  { to: "/cycles", end: false, labelKey: "Cycles" },
  { to: "/repeating-orders", end: false, labelKey: "Repeating Orders" },
] as const

export function Header() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: session } = useSession()

  async function handleSignOut() {
    try {
      await signOut()
    } catch {
      toast.error(t("Could not reach the server. Please try again."))
      return
    }
    navigate("/login", { replace: true })
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "px-3 py-1 text-sm transition-colors",
      isActive
        ? "font-semibold text-foreground border-b-2 border-primary"
        : "text-muted-foreground hover:text-foreground"
    )

  const dropdownNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(isActive ? "font-semibold text-foreground" : "text-muted-foreground")

  const renderNavItems = (isDropdown: boolean) =>
    NAV_ITEMS.map(({ to, end, labelKey }) =>
      isDropdown ? (
        <DropdownMenuItem key={to} asChild>
          <NavLink to={to} end={end} className={dropdownNavLinkClass}>
            {t(labelKey)}
          </NavLink>
        </DropdownMenuItem>
      ) : (
        <NavLink key={to} to={to} end={end} className={navLinkClass}>
          {t(labelKey)}
        </NavLink>
      )
    )

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-4 text-left"
        >
          <img src="/logo.png" alt={t("Logo")} className="h-14 w-auto" />
          <div className="flex flex-col">
            <h1 className="font-serif text-2xl font-semibold uppercase tracking-wide">{t("LISZT: RAPSZÓDIA")}</h1>
            {/* Subtitle is the first thing to go - it's decorative, unlike the nav/utility items below it. */}
            <p className="hidden text-sm text-muted-foreground nav-lg:block">{t("Hleb / Pecivo / Pica")}</p>
          </div>
        </button>

        {session && (
          <>
            <nav className="hidden items-center gap-1 nav-lg:flex">
              {renderNavItems(false)}
            </nav>

            {/* >=1100px: everything inline in one row (unchanged from before). */}
            <div className="hidden items-center gap-3 nav-lg:flex">
              <BackendHealthBadge />
              <Separator orientation="vertical" className="h-6" />
              <LanguageSelector />
              <Separator orientation="vertical" className="h-6" />
              <span className="text-sm text-muted-foreground">{session.user.name}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                {t("Log out")}
              </Button>
            </div>

            {/* 900-1099px: nav links stay inline (primary), utility cluster
                drops to its own compact row (secondary - used far less often). */}
            <nav className="hidden w-full items-center gap-1 nav-md:flex nav-lg:hidden">
              {renderNavItems(false)}
            </nav>
            <div className="hidden w-full items-center justify-end gap-3 nav-md:flex nav-lg:hidden">
              <BackendHealthBadge />
              <LanguageSelector />
              <span className="text-sm text-muted-foreground">{session.user.name}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                {t("Log out")}
              </Button>
            </div>

            {/* <900px: everything collapses into a hamburger. */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="nav-md:hidden" aria-label={t("Menu")}>
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 nav-md:hidden">
                {renderNavItems(true)}
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <BackendHealthBadge />
                </div>
                <div className="px-2 py-1.5">
                  <LanguageSelector />
                </div>
                <DropdownMenuSeparator />
                <div className="px-2 py-1 text-sm text-muted-foreground">{session.user.name}</div>
                <DropdownMenuItem onSelect={handleSignOut} className="cursor-pointer">
                  {t("Log out")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {!session && <LanguageSelector />}
      </div>
    </header>
  )
}
