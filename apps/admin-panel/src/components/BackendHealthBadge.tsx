import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useBackendHealth } from "@/hooks/useBackendHealth"

export function BackendHealthBadge() {
  const { data, isLoading, isError } = useBackendHealth()

  const label = isLoading ? "Checking backend…" : isError ? "Backend offline" : `Backend: ${data?.status}`

  const colorClass = isLoading
    ? "bg-muted text-muted-foreground border-border"
    : isError
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : "bg-success-soft text-success border-success/30"

  return (
    <Badge variant="outline" className={cn(colorClass)}>
      {label}
    </Badge>
  )
}
