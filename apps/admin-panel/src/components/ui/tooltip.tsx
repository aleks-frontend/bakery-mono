import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

interface TooltipProps
  extends Omit<React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>, "children"> {
  trigger: React.ReactNode
  content: React.ReactNode
  contentClassName?: string
  sideOffset?: number
}

// Bundles Root/Trigger/Content into one component (trigger + content passed as
// props) so call sites don't need to import and assemble all three every time.
function Tooltip({ trigger, content, contentClassName, sideOffset = 4, ...rootProps }: TooltipProps) {
  return (
    <TooltipPrimitive.Root {...rootProps}>
      <TooltipPrimitive.Trigger asChild>
        <span>{trigger}</span>
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          contentClassName
        )}
      >
        {content}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Root>
  )
}

export { Tooltip, TooltipProvider }
