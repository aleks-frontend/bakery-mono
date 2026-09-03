import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useCyclesQuery } from "@/hooks/useCyclesQuery"
import { useReopenCycleMutation } from "@/hooks/useReopenCycleMutation"
import { useDeliverCycleMutation } from "@/hooks/useDeliverCycleMutation"
import { useUndoDeliverCycleMutation } from "@/hooks/useUndoDeliverCycleMutation"
import { StartCycleModal } from "@/components/StartCycleModal"
import { CloseCycleModal } from "@/components/CloseCycleModal"
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog"
import { CycleStatusBadge } from "@/components/CycleStatusBadge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Lock, PackageCheck, Plus, Undo2, Unlock } from "lucide-react"

// deliveryDate / nextCycleStartDate are calendar dates picked via a date
// input (see StartCycleModal/CloseCycleModal), stored as UTC midnight —
// format them against UTC too, not the viewer's local timezone, so they
// always show the day that was actually picked. (createdAt is a real
// instant, not a calendar date, so it's left on toLocaleDateString()'s
// default local-timezone formatting.)
function formatCalendarDate(date: Date): string {
  return date.toLocaleDateString(undefined, { timeZone: "UTC" })
}

export function CyclesPage() {
  const { t } = useTranslation()
  const { data: cycles = [], isLoading, error } = useCyclesQuery()
  const reopenMutation = useReopenCycleMutation()
  const deliverMutation = useDeliverCycleMutation()
  const undoDeliverMutation = useUndoDeliverCycleMutation()

  const [isStartOpen, setIsStartOpen] = useState(false)
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false)
  const [isDeliverConfirmOpen, setIsDeliverConfirmOpen] = useState(false)

  // Cycles progress OPEN -> CLOSED -> COMPLETED one at a time, so the most
  // recent one (by delivery date) always tells us what action is next.
  const latestCycle = cycles[0] ?? null
  const history = cycles.slice(1)

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t("Loading...")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive font-medium mb-2">{t("Error loading cycles")}</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">{t("Cycles")}</h1>
        <p className="text-muted-foreground">{t("Manage the weekly ordering cycle")}</p>
      </div>

      <div className="rounded-md border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t("Current Cycle")}</h2>

        {!latestCycle ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("No cycles yet.")}</p>
            <Button onClick={() => setIsStartOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("Start Next Cycle")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("Label")}</p>
                <p className="text-sm">{latestCycle.label}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("Status")}</p>
                <div className="mt-1">
                  <CycleStatusBadge status={latestCycle.status} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("Cycle Started")}</p>
                <p className="text-sm">{latestCycle.createdAt.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("Delivery Date")}</p>
                <p className="text-sm">{formatCalendarDate(latestCycle.deliveryDate)}</p>
              </div>
              {latestCycle.nextCycleStartDate && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("Next order window opens")}</p>
                  <p className="text-sm">{formatCalendarDate(latestCycle.nextCycleStartDate)}</p>
                </div>
              )}
            </div>

            {(latestCycle.holidayMessageEn || latestCycle.holidayMessageSr || latestCycle.holidayMessageHu) && (
              <div className="space-y-1">
                {latestCycle.holidayMessageEn && (
                  <p className="text-sm text-muted-foreground italic">
                    <span className="font-medium not-italic">{t("English")}: </span>
                    {latestCycle.holidayMessageEn}
                  </p>
                )}
                {latestCycle.holidayMessageSr && (
                  <p className="text-sm text-muted-foreground italic">
                    <span className="font-medium not-italic">{t("Serbian")}: </span>
                    {latestCycle.holidayMessageSr}
                  </p>
                )}
                {latestCycle.holidayMessageHu && (
                  <p className="text-sm text-muted-foreground italic">
                    <span className="font-medium not-italic">{t("Hungarian")}: </span>
                    {latestCycle.holidayMessageHu}
                  </p>
                )}
              </div>
            )}

            <Separator />

            <div className="flex gap-2">
              {latestCycle.status === "COMPLETED" && (
                <>
                  <Button onClick={() => setIsStartOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("Start Next Cycle")}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => undoDeliverMutation.mutate(latestCycle.id)}
                    disabled={undoDeliverMutation.isPending}
                  >
                    <Undo2 className="mr-2 h-4 w-4" />
                    {t("Undo Mark Delivered")}
                  </Button>
                </>
              )}
              {latestCycle.status === "OPEN" && (
                <Button variant="outline" onClick={() => setIsCloseConfirmOpen(true)}>
                  <Lock className="mr-2 h-4 w-4" />
                  {t("Close Ordering")}
                </Button>
              )}
              {latestCycle.status === "CLOSED" && (
                <>
                  <Button variant="outline" onClick={() => setIsDeliverConfirmOpen(true)}>
                    <PackageCheck className="mr-2 h-4 w-4" />
                    {t("Mark Delivered")}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => reopenMutation.mutate(latestCycle.id)}
                    disabled={reopenMutation.isPending}
                  >
                    <Unlock className="mr-2 h-4 w-4" />
                    {t("Reopen Ordering")}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="rounded-md border bg-card">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">{t("Cycle History")}</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/60 text-left border-b-2 border-border">
                <th className="px-4 py-2 font-semibold text-xs text-foreground">{t("Label")}</th>
                <th className="px-4 py-2 font-semibold text-xs text-foreground">{t("Status")}</th>
                <th className="px-4 py-2 font-semibold text-xs text-foreground">{t("Delivery Date")}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((cycle) => (
                <tr key={cycle.id} className="border-t">
                  <td className="px-4 py-2">{cycle.label}</td>
                  <td className="px-4 py-2">
                    <CycleStatusBadge status={cycle.status} />
                  </td>
                  <td className="px-4 py-2">{formatCalendarDate(cycle.deliveryDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <StartCycleModal open={isStartOpen} onOpenChange={setIsStartOpen} />

      {latestCycle && (
        <>
          <CloseCycleModal
            open={isCloseConfirmOpen}
            onOpenChange={setIsCloseConfirmOpen}
            cycleId={latestCycle.id}
            cycleLabel={latestCycle.label}
          />
          <ConfirmActionDialog
            open={isDeliverConfirmOpen}
            onOpenChange={setIsDeliverConfirmOpen}
            title={t("Confirm Mark Delivered")}
            description={t("This will mark cycle {{label}} as delivered.", {
              label: latestCycle.label,
            })}
            confirmLabel={t("Mark Delivered")}
            pendingLabel={t("Marking...")}
            isPending={deliverMutation.isPending}
            onConfirm={() =>
              deliverMutation.mutate(latestCycle.id, { onSuccess: () => setIsDeliverConfirmOpen(false) })
            }
          />
        </>
      )}
    </div>
  )
}
