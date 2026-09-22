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
import { Loader2, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Cycle } from "@bakery/api-client"
import { useUpdateHolidayMessageMutation } from "@/hooks/useUpdateHolidayMessageMutation"
import { useGenerateHolidayMessageMutation } from "@/hooks/useGenerateHolidayMessageMutation"

interface EditHolidayMessageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cycle: Cycle
}

const textareaClassName =
  "mt-1 block w-full border border-input rounded-md px-3 py-2 text-sm bg-white resize-none disabled:opacity-50 disabled:cursor-not-allowed"

export function EditHolidayMessageModal({ open, onOpenChange, cycle }: EditHolidayMessageModalProps) {
  const { t } = useTranslation()
  const updateMutation = useUpdateHolidayMessageMutation()
  const generateMutation = useGenerateHolidayMessageMutation()

  const [messages, setMessages] = useState({ en: "", sr: "", hu: "" })
  const [instruction, setInstruction] = useState("")

  // Re-seed from the cycle every time the dialog opens, so a cancelled edit
  // never leaks into the next open.
  useEffect(() => {
    if (open) {
      setMessages({
        en: cycle.holidayMessageEn ?? "",
        sr: cycle.holidayMessageSr ?? "",
        hu: cycle.holidayMessageHu ?? "",
      })
      setInstruction("")
    }
  }, [open, cycle])

  const hasMessages = Boolean(messages.en.trim() || messages.sr.trim() || messages.hu.trim())
  const isBusy = updateMutation.isPending || generateMutation.isPending

  const handleGenerate = () => {
    if (!instruction.trim() || !cycle.nextCycleStartDate) return

    generateMutation.mutate(
      { instruction: instruction.trim(), nextCycleStartDate: cycle.nextCycleStartDate },
      { onSuccess: (result) => setMessages({ en: result.en, sr: result.sr, hu: result.hu }) }
    )
  }

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

  const fields = [
    { key: "en", label: t("English") },
    { key: "sr", label: t("Serbian") },
    { key: "hu", label: t("Hungarian") },
  ] as const

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader className="pr-10">
          <DialogTitle>{t("Edit Holiday Message")}</DialogTitle>
          <DialogDescription>
            {t("Shown to customers on the order form while ordering is closed. Leave a language empty to hide it.")}
          </DialogDescription>
        </DialogHeader>

        <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t("Holiday message instructions")}</label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={2}
              disabled={isBusy}
              placeholder={t("Describe the holiday in any language, e.g. \"closed for Christmas, back Jan 5th\"")}
              className={textareaClassName}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              disabled={!instruction.trim() || !cycle.nextCycleStartDate || isBusy}
              onClick={handleGenerate}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("Generating...")}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {hasMessages ? t("Regenerate holiday messages") : t("Generate holiday messages")}
                </>
              )}
            </Button>
          </div>

          {fields.map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs font-medium text-muted-foreground">{label}</label>
              <textarea
                value={messages[key]}
                onChange={(e) => setMessages((prev) => ({ ...prev, [key]: e.target.value }))}
                rows={4}
                disabled={isBusy}
                className={textareaClassName}
              />
            </div>
          ))}
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
