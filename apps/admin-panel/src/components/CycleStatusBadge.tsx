import { Badge } from "@/components/ui/badge"
import type { CycleStatus } from "@bakery/api-client"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

interface CycleStatusBadgeProps {
  status: CycleStatus
  className?: string
}

const statusColors: Record<CycleStatus, string> = {
  OPEN: "bg-green-100 text-green-800 border-green-200",
  CLOSED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  COMPLETED: "bg-gray-100 text-gray-700 border-gray-200",
}

const statusLabelKey: Record<CycleStatus, string> = {
  OPEN: "Open",
  CLOSED: "Closed",
  COMPLETED: "Completed",
}

export function CycleStatusBadge({ status, className }: CycleStatusBadgeProps) {
  const { t } = useTranslation()
  return (
    <Badge variant="outline" className={cn(statusColors[status], className)}>
      {t(statusLabelKey[status])}
    </Badge>
  )
}
