import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Cycle } from "@bakery/api-client"
import { useIsMutating } from "@tanstack/react-query"
import { useUpdateHolidayMessageMutation } from "@/hooks/useUpdateHolidayMessageMutation"
import { generateHolidayMessageMutationKey } from "@/hooks/useGenerateHolidayMessageMutation"
import { HolidayMessageEditor, type HolidayMessages } from "@/components/HolidayMessageEditor"

const emptyHolidayMessages: HolidayMessages = { en: "", sr: "", hu: "" }

interface EditHolidayMessageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cycle: Cycle
}

export function EditHolidayMessageModal({ open, onOpenChange, cycle }: EditHolidayMessageModalProps) {
  const { t } = useTranslation()
  const updateMutation = useUpdateHolidayMessageMutation()
  const isGenerating = useIsMutating({ mutationKey: generateHolidayMessageMutationKey }) > 0
  const isBusy = updateMutation.isPending || isGenerating

  const [messages, setMessages] = useState(emptyHolidayMessages)
  // A saved message opens straight into Manual for a quick fix; otherwise AI.
  const hasSavedMessage = [cycle.holidayMessageEn, cycle.holidayMessageSr, cycle.holidayMessageHu].some(
    (message) => Boolean(message?.trim())
  )

  // Re-seed from the cycle every time the dialog opens, so a cancelled edit
  // never leaks into the next open.
  useEffect(() => {
    if (open) {
      setMessages({
        en: cycle.holidayMessageEn ?? "",
        sr: cycle.holidayMessageSr ?? "",
        hu: cycle.holidayMessageHu ?? "",
      })
    }
  }, [open, cycle])

  const handleSubmit = () => {
    updateMutation.mutate(
      {
        id: cycle.id,
        input: {
          holidayMessageEn: messages.en.trim() || null,
          holidayMessageSr: messages.sr.trim() || null,
          holidayMessageHu: messages.hu.trim() || null,
        },
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  // Escape/overlay can't close it mid-request: unmounting would drop the suggestion.
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!isBusy) onOpenChange(next) }}>
      <DialogContent className="max-w-xl">
        <DialogHeader className="pr-10">
          <DialogTitle>{t("Edit Holiday Message")}</DialogTitle>
          <DialogDescription>
            {t("Shown to customers on the order form while ordering is closed. Leave a language empty to hide it.")}
          </DialogDescription>
        </DialogHeader>

        <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className="space-y-4 py-2">
          <HolidayMessageEditor
            value={messages}
            onChange={setMessages}
            nextCycleStartDate={cycle.nextCycleStartDate}
            defaultMode={hasSavedMessage ? "manual" : "ai"}
            disabled={updateMutation.isPending}
          />
        </form>

        <DialogFooter className="gap-2 mt-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
            {t("Cancel")}
          </Button>
          <Button disabled={isBusy} onClick={handleSubmit}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Saving...")}
              </>
            ) : (
              t("Save Changes")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
