import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useBackendHealth } from "@/hooks/useBackendHealth"

export function BackendHealthBadge() {
  const { data, isLoading, isError } = useBackendHealth()

  const label = isLoading ? "Checking backend…" : isError ? "Backend offline" : `Backend: ${data?.status}`

  const colorClass = isLoading
    ? "bg-gray-100 text-gray-600 border-gray-200"
    : isError
      ? "bg-red-100 text-red-800 border-red-200"
      : "bg-green-100 text-green-800 border-green-200"

  return (
    <Badge variant="outline" className={cn(colorClass)}>
      {label}
    </Badge>
  )
}
