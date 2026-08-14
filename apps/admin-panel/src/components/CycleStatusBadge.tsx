import { Badge } from "@/components/ui/badge"
import type { CycleStatus } from "@bakery/api-client"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

interface CycleStatusBadgeProps {
  status: CycleStatus
  className?: string
}

const statusColors: Record<CycleStatus, string> = {
  OPEN: "bg-success-soft text-success border-success/30",
  CLOSED: "bg-warning-soft text-warning border-warning/30",
  COMPLETED: "bg-muted text-muted-foreground border-border",
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
