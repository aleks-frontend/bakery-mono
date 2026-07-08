import { Badge } from "@/components/ui/badge"
import { OrderStatus } from "@/types/order"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

const statusColors: Record<OrderStatus, string> = {
  "Not received": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
  "Delivered": "bg-green-100 text-green-800 border-green-200",
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation()
  return (
    <Badge
      variant="outline"
      className={cn(statusColors[status], className)}
    >
      {t(status)}
    </Badge>
  )
}
