import { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cyclesClient } from "@/lib/apiClient"
import { HolidayMessageEditor, type HolidayMessageMode, type HolidayMessages } from "./HolidayMessageEditor"

const REOPENING = new Date("2027-01-09T00:00:00.000Z")
const LATER_REOPENING = new Date("2027-01-16T00:00:00.000Z")
const INSTRUCTION = "closed for Christmas"
const STALE_HINT = "Reopening date changed, regenerate the message."
const EMPTY: HolidayMessages = { en: "", sr: "", hu: "" }
const SUGGESTION: HolidayMessages = {
  en: "Merry Christmas! 🎄 Orders open 9 January 2027.",
  sr: "Srećan Božić! 🎄 Porudžbine od 9. januara 2027.",
  hu: "Boldog karácsonyt! 🎄 Rendelés 2027. január 9-től.",
}

interface HostProps {
  defaultMode?: HolidayMessageMode
  nextCycleStartDate?: Date | null
  onChange?: (value: HolidayMessages) => void
}

/** Plays the parent modal: owns the Manual fields and saves whatever they hold. */
function Host({ defaultMode = "ai", nextCycleStartDate = REOPENING, onChange }: HostProps) {
  const [value, setValue] = useState(EMPTY)
  return (
    <HolidayMessageEditor
      value={value}
      onChange={(next) => {
        onChange?.(next)
        setValue(next)
      }}
      nextCycleStartDate={nextCycleStartDate}
      defaultMode={defaultMode}
    />
  )
}

function renderEditor(props: HostProps = {}) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const generate = vi.spyOn(cyclesClient, "generateHolidayMessage").mockResolvedValue(SUGGESTION)
  const onChange = vi.fn()
  const wrap = (hostProps: HostProps) => (
    <QueryClientProvider client={queryClient}>
      <Host onChange={onChange} {...hostProps} />
    </QueryClientProvider>
  )
  const view = render(wrap(props))
  return {
    generate,
    onChange,
    user: userEvent.setup(),
    setDate: (nextCycleStartDate: Date | null) => view.rerender(wrap({ ...props, nextCycleStartDate })),
  }
}

const modeButton = (name: "Generate with AI" | "Write manually") => screen.getByRole("button", { name })
const instructionField = () => screen.getByPlaceholderText(/Describe the holiday/)
const generateButton = () => screen.getByRole("button", { name: /(Re)?generate holiday messages/i })
const useButton = () => screen.getByRole("button", { name: "Use this message" })

async function generateSuggestion(user: ReturnType<typeof userEvent.setup>) {
  await user.type(instructionField(), INSTRUCTION)
  await user.click(generateButton())
  await screen.findByText(SUGGESTION.en)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("HolidayMessageEditor", () => {
  it.each(["ai", "manual"] as const)("opens in the %s mode it's given", (defaultMode) => {
    renderEditor({ defaultMode })

    expect(modeButton("Generate with AI")).toHaveAttribute("aria-pressed", String(defaultMode === "ai"))
    expect(modeButton("Write manually")).toHaveAttribute("aria-pressed", String(defaultMode === "manual"))
  })

  it("shows a generated suggestion read-only, without changing the saved message", async () => {
    const { user, generate, onChange } = renderEditor()

    await generateSuggestion(user)

    expect(generate).toHaveBeenCalledWith({ instruction: INSTRUCTION, nextCycleStartDate: REOPENING })
    for (const message of Object.values(SUGGESTION)) {
      expect(screen.getByText(message)).toBeInTheDocument()
    }
    // The instruction is the only field; the suggestion isn't editable.
    expect(screen.getAllByRole("textbox")).toEqual([instructionField()])
    expect(onChange).not.toHaveBeenCalled()
  })

  it("copies the suggestion into the Manual fields when it's used", async () => {
    const { user, onChange } = renderEditor()
    await generateSuggestion(user)

    await user.click(useButton())

    expect(onChange).toHaveBeenCalledWith(SUGGESTION)
    expect(modeButton("Write manually")).toHaveAttribute("aria-pressed", "true")
    expect(screen.getAllByRole("textbox").map((field) => (field as HTMLTextAreaElement).value)).toEqual([
      SUGGESTION.en,
      SUGGESTION.sr,
      SUGGESTION.hu,
    ])
  })

  it("keeps the description, the suggestion and the Manual text across mode switches", async () => {
    const { user } = renderEditor()
    await generateSuggestion(user)

    await user.click(modeButton("Write manually"))
    await user.type(screen.getAllByRole("textbox")[0], "Back soon!")
    await user.click(modeButton("Generate with AI"))

    expect(instructionField()).toHaveValue(INSTRUCTION)
    expect(screen.getByText(SUGGESTION.en)).toBeInTheDocument()

    await user.click(modeButton("Write manually"))

    expect(screen.getAllByRole("textbox")[0]).toHaveValue("Back soon!")
  })

  it("flags the suggestion as stale once the reopening date changes", async () => {
    const { user, setDate } = renderEditor()
    await generateSuggestion(user)

    setDate(LATER_REOPENING)

    expect(screen.getByText(STALE_HINT)).toBeInTheDocument()
    expect(useButton()).toBeDisabled()

    // A fresh Date for the same day, as the date input produces on every render.
    setDate(new Date(REOPENING.getTime()))

    expect(screen.queryByText(STALE_HINT)).not.toBeInTheDocument()
    expect(useButton()).toBeEnabled()
  })

  it("clears the stale flag when regenerated for the new date", async () => {
    const { user, generate, setDate } = renderEditor()
    await generateSuggestion(user)
    setDate(LATER_REOPENING)

    await user.click(generateButton())

    expect(generate).toHaveBeenLastCalledWith({ instruction: INSTRUCTION, nextCycleStartDate: LATER_REOPENING })
    expect(await screen.findByRole("button", { name: "Use this message" })).toBeEnabled()
    expect(screen.queryByText(STALE_HINT)).not.toBeInTheDocument()
  })

  it("can't generate without a description", () => {
    renderEditor()

    expect(generateButton()).toBeDisabled()
  })

  it("can't generate without a reopening date", async () => {
    const { user } = renderEditor({ nextCycleStartDate: null })

    await user.type(instructionField(), INSTRUCTION)

    expect(generateButton()).toBeDisabled()
  })
})
