import { useState } from "react"
import { useIsMutating } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { GenerateHolidayMessageResult } from "@bakery/api-client"
import {
  generateHolidayMessageMutationKey,
  useGenerateHolidayMessageMutation,
} from "@/hooks/useGenerateHolidayMessageMutation"

/** One message per language, the same shape the generate endpoint returns. */
export type HolidayMessages = GenerateHolidayMessageResult

interface HolidayMessageEditorProps {
  value: HolidayMessages
  onChange: (value: HolidayMessages) => void
  /** The date the generated message announces; generating is off while it's missing. */
  nextCycleStartDate: Date | null
  /** Locks every field, e.g. while the parent modal is saving. */
  disabled?: boolean
}

const textareaClassName =
  "mt-1 block w-full border border-input rounded-md px-3 py-2 text-sm bg-white resize-none disabled:opacity-50 disabled:cursor-not-allowed"

/**
 * The holiday-message form shared by the Close Ordering and Edit Holiday
 * Message modals: an instruction box that generates all three languages, plus
 * the EN/SR/HU fields. The parent owns the messages and saves them; this owns
 * the instruction, which resets whenever the modal (and so this) remounts.
 */
export function HolidayMessageEditor({
  value,
  onChange,
  nextCycleStartDate,
  disabled = false,
}: HolidayMessageEditorProps) {
  const { t } = useTranslation()
  const generateMutation = useGenerateHolidayMessageMutation()
  const [instruction, setInstruction] = useState("")

  // Counted app-wide rather than from this mutation's own state, so an editor
  // remounted mid-request (Close Ordering's toggle off and on) stays locked.
  const isGenerating = useIsMutating({ mutationKey: generateHolidayMessageMutationKey }) > 0
  const isBusy = disabled || isGenerating
  const hasMessages = Boolean(value.en.trim() || value.sr.trim() || value.hu.trim())

  const handleGenerate = () => {
    if (!instruction.trim() || !nextCycleStartDate) return

    generateMutation.mutate(
      { instruction: instruction.trim(), nextCycleStartDate },
      { onSuccess: onChange }
    )
  }

  const fields = [
    { key: "en", label: t("English") },
    { key: "sr", label: t("Serbian") },
    { key: "hu", label: t("Hungarian") },
  ] as const

  return (
    <>
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
          disabled={!instruction.trim() || !nextCycleStartDate || isBusy}
          onClick={handleGenerate}
        >
          {isGenerating ? (
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
            value={value[key]}
            onChange={(e) => onChange({ ...value, [key]: e.target.value })}
            rows={4}
            disabled={isBusy}
            className={textareaClassName}
          />
        </div>
      ))}
    </>
  )
}
