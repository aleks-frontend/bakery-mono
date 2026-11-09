import type { LanguageModel } from "ai";
import { z } from "zod";
import {
  generateHolidayMessageResponseSchema,
  type GenerateHolidayMessageResult,
} from "@bakery/schemas";

// Same "New orders will be available from {{date}} 💛" / "Until then, check
// out our offer..." shape shown by apps/order-form's OrderStatusBanner when
// no holiday message is set — the model is told to match that tone rather
// than invent its own.
const STANDARD_MESSAGE_PATTERN =
  "New orders will be available from [date] 💛 Until then, check out our offer and learn about how we prepare our products.";

const INSTRUCTIONS = `You write short customer-facing holiday closure announcements for a bakery.

The baker describes a holiday closure in English, Serbian, or Hungarian, and gives the date the next order window opens. Detect the language of the description, then write the SAME message in all three languages: English (en), Serbian (sr), Hungarian (hu).

Style to match (this is the bakery's standard, non-holiday closed-ordering message, shown to customers when no holiday message is set — match its warm, friendly, brief tone and its use of the reopening date):
"${STANDARD_MESSAGE_PATTERN}"

Write a warm, friendly holiday version instead:
- Mention the reason for closing, taken from the baker's description.
- State that new orders open again on the given date, written the way each language naturally writes dates (e.g. "9 January 2027", "9. januar 2027.", "2027. január 9.").
- Use 1-3 emoji that fit the specific holiday's spirit (not necessarily 💛).
- Keep each message to 1-3 short sentences, with no markdown formatting and no placeholders.`;

// The shared response shape, tightened for what the model must return.
const holidayMessagesSchema = generateHolidayMessageResponseSchema.extend({
  en: z.string().trim().min(1).describe("The message in English"),
  sr: z.string().trim().min(1).describe("The message in Serbian (Latin script)"),
  hu: z.string().trim().min(1).describe("The message in Hungarian"),
});

/** Thrown for anything that stops a generation; the route answers it with a 502. */
export class HolidayMessageGenerationError extends Error {}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** The providers `AI_HOLIDAY_MESSAGE_MODEL` may name, each with the env var holding its key. */
const PROVIDERS = {
  openai: {
    keyVar: "OPENAI_API_KEY",
    async model(apiKey: string, modelId: string): Promise<LanguageModel> {
      const { createOpenAI } = await import("@ai-sdk/openai");
      return createOpenAI({ apiKey })(modelId);
    },
  },
} as const;

/**
 * The model `AI_HOLIDAY_MESSAGE_MODEL` (`provider:model`, a dated snapshot)
 * and that provider's key configure. Anything missing or unknown disables
 * generation with a `HolidayMessageGenerationError`.
 */
async function modelFromEnv(): Promise<LanguageModel> {
  const setting = process.env.AI_HOLIDAY_MESSAGE_MODEL;
  if (!setting) {
    throw new HolidayMessageGenerationError(
      "AI_HOLIDAY_MESSAGE_MODEL not set — AI generation is disabled",
    );
  }
  const [providerName, modelId] = setting.split(/:(.*)/s);
  const provider = Object.hasOwn(PROVIDERS, providerName)
    ? PROVIDERS[providerName as keyof typeof PROVIDERS]
    : undefined;
  if (!provider || !modelId) {
    throw new HolidayMessageGenerationError(
      `AI_HOLIDAY_MESSAGE_MODEL must be provider:model, with provider one of ${Object.keys(PROVIDERS).join(", ")}`,
    );
  }
  const apiKey = process.env[provider.keyVar];
  if (!apiKey) {
    throw new HolidayMessageGenerationError(
      `${provider.keyVar} not set — AI generation is disabled`,
    );
  }
  return provider.model(apiKey, modelId);
}

type GenerateHolidayMessagesOptions = {
  /** A model to use instead of the one the environment configures (tests). */
  model?: LanguageModel;
};

export async function generateHolidayMessages(
  instruction: string,
  nextCycleStartDate: Date,
  { model }: GenerateHolidayMessagesOptions = {},
): Promise<GenerateHolidayMessageResult> {
  const resolvedModel = model ?? (await modelFromEnv());

  // Loaded lazily rather than at module scope — this whole SDK graph would
  // otherwise sit resident in memory for the process's entire lifetime even
  // though this function is only invoked a handful of times a month.
  const { generateText, Output } = await import("ai");

  try {
    const { output } = await generateText({
      model: resolvedModel,
      instructions: INSTRUCTIONS,
      prompt: `Baker's description: "${instruction}"\n\nThe next order window opens on: ${formatDate(nextCycleStartDate)}`,
      output: Output.object({ schema: holidayMessagesSchema, name: "holiday_message" }),
      // The baker's text stays out of OpenAI's storage and the dashboard's Logs;
      // a three-sentence announcement needs little reasoning. Other providers
      // ignore options keyed to OpenAI.
      providerOptions: { openai: { store: false, reasoningEffort: "low" } },
    });
    return output;
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    console.error(
      `[ai] holiday message generation failed: ${(error as Error).name}${status ? ` (${status})` : ""}`,
    );
    // Provider errors and unparseable output both become a 502. The message is
    // generic on purpose: the SDK's may quote the baker's text or the response.
    throw new HolidayMessageGenerationError(
      "AI generation failed — try again or write the message manually",
      {
        cause: error,
      },
    );
  }
}
