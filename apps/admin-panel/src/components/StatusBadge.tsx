import { Badge } from "@/components/ui/badge"
import type { OrderStatus } from "@bakery/api-client"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

const statusColors: Record<OrderStatus, string> = {
  NOT_RECEIVED: "bg-warning-soft text-warning border-warning/30",
  IN_PROGRESS: "bg-accent text-primary border-primary/30",
  DELIVERED: "bg-success-soft text-success border-success/30",
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
