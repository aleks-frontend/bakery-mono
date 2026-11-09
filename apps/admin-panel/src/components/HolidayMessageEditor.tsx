import { useState } from "react"
import { useIsMutating } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Loader2, PenLine, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { GenerateHolidayMessageResult } from "@bakery/api-client"
import { cn } from "@/lib/utils"
import {
  generateHolidayMessageMutationKey,
  useGenerateHolidayMessageMutation,
} from "@/hooks/useGenerateHolidayMessageMutation"

/** One message per language, the same shape the generate endpoint returns. */
export type HolidayMessages = GenerateHolidayMessageResult

export type HolidayMessageMode = "ai" | "manual"

interface HolidayMessageEditorProps {
  /** The three Manual fields: always exactly what the parent saves. */
  value: HolidayMessages
  onChange: (value: HolidayMessages) => void
  /** The date the generated message announces; generating is off while it's missing. */
  nextCycleStartDate: Date | null
  /** The mode shown when the editor mounts. */
  defaultMode: HolidayMessageMode
  /** Locks every field, e.g. while the parent modal is saving. */
  disabled?: boolean
}

/** A generated suggestion and the reopening date it announces. */
interface Suggestion {
  messages: HolidayMessages
  generatedFor: Date
}

const textareaClassName =
  "mt-1 block w-full border border-input rounded-md px-3 py-2 text-sm bg-white resize-none disabled:opacity-50 disabled:cursor-not-allowed"

/**
 * The holiday-message form shared by the Close Ordering and Edit Holiday
 * Message modals, in two modes:
 * - AI: an instruction that generates a read-only EN/SR/HU suggestion, which
 *   "Use this message" copies into the fields (switching to Manual).
 * - Manual: the EN/SR/HU fields themselves.
 * The parent owns the fields and saves them. This owns the mode, instruction
 * and suggestion, which survive mode switches and reset when it remounts.
 * A suggestion is stale once the reopening date differs from the one it was
 * generated for, so a message announcing the wrong date can't be used.
 */
export function HolidayMessageEditor({
  value,
  onChange,
  nextCycleStartDate,
  defaultMode,
  disabled = false,
}: HolidayMessageEditorProps) {
  const { t } = useTranslation()
  const generateMutation = useGenerateHolidayMessageMutation()
  const [mode, setMode] = useState(defaultMode)
  const [instruction, setInstruction] = useState("")
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)

  // Counted app-wide rather than from this mutation's own state, so an editor
  // remounted mid-request (Close Ordering's toggle off and on) stays locked.
  const isGenerating = useIsMutating({ mutationKey: generateHolidayMessageMutationKey }) > 0
  const isBusy = disabled || isGenerating
  const isStale =
    suggestion !== null && suggestion.generatedFor.getTime() !== nextCycleStartDate?.getTime()

  const handleGenerate = () => {
    if (!instruction.trim() || !nextCycleStartDate) return

    const generatedFor = nextCycleStartDate
    generateMutation.mutate(
      { instruction: instruction.trim(), nextCycleStartDate: generatedFor },
      { onSuccess: (messages) => setSuggestion({ messages, generatedFor }) }
    )
  }

  const handleUseSuggestion = () => {
    if (!suggestion || isStale) return
    onChange(suggestion.messages)
    setMode("manual")
  }

  const languages = [
    { key: "en", label: t("English") },
    { key: "sr", label: t("Serbian") },
    { key: "hu", label: t("Hungarian") },
  ] as const

  const modes = [
    { key: "ai", label: t("Generate with AI"), icon: Sparkles },
    { key: "manual", label: t("Write manually"), icon: PenLine },
  ] as const

  return (
    <>
      <div
        role="group"
        aria-label={t("Holiday message mode")}
        className="inline-flex rounded-md border border-border bg-muted p-1"
      >
        {modes.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            type="button"
            variant="ghost"
            size="xs"
            aria-pressed={mode === key}
            disabled={isBusy}
            onClick={() => setMode(key)}
            className={cn(
              "px-3",
              mode === key
                ? "bg-card text-foreground font-semibold shadow ring-1 ring-border hover:bg-card"
                : "text-muted-foreground hover:bg-transparent hover:text-foreground"
            )}
          >
            <Icon className="mr-1.5 h-3.5 w-3.5" />
            {label}
          </Button>
        ))}
      </div>

      {mode === "ai" ? (
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
              className="mt-2 border-violet-500 bg-violet-50 text-violet-700 shadow-sm hover:bg-violet-100 hover:text-violet-800"
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
                  {suggestion ? t("Regenerate holiday messages") : t("Generate holiday messages")}
                </>
              )}
            </Button>
            {!nextCycleStartDate && (
              <p className="text-xs text-muted-foreground mt-1">{t("Set the reopening date to generate a message.")}</p>
            )}
          </div>

          {suggestion && (
            <div className="rounded-md border border-dashed bg-muted/60 p-3 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Suggestion")}</p>
                <p className="text-xs text-muted-foreground">{t("Not saved until you use it.")}</p>
              </div>
              {languages.map(({ key, label }) => (
                <div key={key}>
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="text-sm whitespace-pre-wrap">{suggestion.messages[key]}</p>
                </div>
              ))}
              {isStale && (
                <p className="text-xs text-destructive">{t("Reopening date changed, regenerate the message.")}</p>
              )}
              <Button type="button" size="sm" disabled={isBusy || isStale} onClick={handleUseSuggestion}>
                {t("Use this message")}
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{t("This is the message that gets saved.")}</p>
          {languages.map(({ key, label }) => (
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
      )}
    </>
  )
}
