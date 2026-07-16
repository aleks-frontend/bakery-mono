import { Badge } from "@/components/ui/badge"
import type { OrderStatus } from "@bakery/api-client"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

const statusColors: Record<OrderStatus, string> = {
  NOT_RECEIVED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
}

/** Reuses the existing (already-translated) human-readable labels rather than adding new i18n keys. */
const statusLabelKey: Record<OrderStatus, string> = {
  NOT_RECEIVED: "Not received",
  IN_PROGRESS: "In Progress",
  DELIVERED: "Delivered",
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation()
  return (
    <Badge
      variant="outline"
      className={cn(statusColors[status], className)}
    >
      {t(statusLabelKey[status])}
    </Badge>
  )
}
