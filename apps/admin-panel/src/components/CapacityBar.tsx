import { cn } from "@/lib/utils"

interface CapacityBarProps {
  capacity: number
  remaining: number
}

// Percentage-of-capacity thresholds (scale-independent, unlike the backend's
// absolute LOW_STOCK_THRESHOLD) that decide the gauge's color.
const LOW_THRESHOLD_PCT = 20
const FULL_THRESHOLD_PCT = 50

// Literal class names (not template-built) so Tailwind's scanner picks them up.
const LEVEL_STYLES = {
  low: { fill: "bg-destructive", text: "text-destructive" },
  mid: { fill: "bg-warning", text: "text-warning" },
  full: { fill: "bg-success", text: "text-success" },
} as const

export function CapacityBar({ capacity, remaining }: CapacityBarProps) {
  const pct = capacity > 0 ? Math.max(0, Math.min(100, (remaining / capacity) * 100)) : 0
  const level = pct <= LOW_THRESHOLD_PCT ? "low" : pct <= FULL_THRESHOLD_PCT ? "mid" : "full"
  const { fill, text } = LEVEL_STYLES[level]

  return (
    <div className="flex items-center gap-2">
      <div className="h-4 w-16 rounded-full bg-muted p-0.5">
        <div className={cn("h-full rounded-full transition-all duration-300", fill)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-xs font-medium tabular-nums", text)}>
        {remaining}/{capacity}
      </span>
    </div>
  )
}
