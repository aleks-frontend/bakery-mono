import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Loader2 } from "lucide-react"
import { signIn, useSession } from "@/lib/authClient"
import { createLoginSchema, type LoginValues } from "@/types/login"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: session } = useSession()
  const [authError, setAuthError] = useState<string | null>(null)

  const schema = useMemo(() => createLoginSchema(t), [t])
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(schema) })

  // Navigate off the session hook itself, rather than right after signIn.email()
  // resolves — the client's session store updates asynchronously, and RequireAuth
  // would otherwise bounce a too-early navigate("/") straight back to /login.
  useEffect(() => {
    if (session) {
      navigate("/", { replace: true })
    }
  }, [session, navigate])

  async function onSubmit(values: LoginValues) {
    setAuthError(null)

    const { error: signInError } = await signIn.email(values)

    if (signInError) {
      setAuthError(t("Invalid email or password"))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-bold">{t("Log in")}</h1>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            {t("Email")}
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className={errors.email && "border-destructive focus-visible:ring-destructive"}
            {...register("email")}
          />
          {errors.email?.message && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            {t("Password")}
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className={errors.password && "border-destructive focus-visible:ring-destructive"}
            {...register("password")}
          />
          {errors.password?.message && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        {authError && <p className="text-sm text-destructive">{authError}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Log in")}
        </Button>
      </form>
    </div>
  )
}
