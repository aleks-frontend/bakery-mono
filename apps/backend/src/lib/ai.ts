import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import type { GenerateHolidayMessageResult } from "@bakery/schemas";

// Free-tier eligible via Google AI Studio — plenty for a short structured JSON reply.
// gemini-2.0-flash was sunset; Google's API error pointed at this replacement.
const MODEL = "gemini-3.6-flash";

// Same "New orders will be available from {{date}} 💛" / "Until then, check
// out our offer..." shape shown by apps/order-form's OrderStatusBanner when
// no holiday message is set — the model is told to match that tone rather
// than invent its own.
const STANDARD_MESSAGE_PATTERN =
  "New orders will be available from [date] 💛 Until then, check out our offer and learn about how we prepare our products.";

export class HolidayMessageGenerationError extends Error {}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
}

function extractJson(text: string): unknown {
  // Models occasionally wrap JSON in a ```json fence despite instructions not
  // to — strip that before parsing rather than failing the whole request.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const jsonText = fenced ? fenced[1] : text;
  try {
    return JSON.parse(jsonText);
  } catch {
    throw new HolidayMessageGenerationError("AI response was not valid JSON");
  }
}

export async function generateHolidayMessages(
  instruction: string,
  nextCycleStartDate: Date,
): Promise<GenerateHolidayMessageResult> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new HolidayMessageGenerationError("GOOGLE_GENERATIVE_AI_API_KEY not set — AI generation is disabled");
  }

  const prompt = `You write short customer-facing holiday closure announcements for a bakery.

The baker will give you an instruction describing a holiday closure, written in English, Serbian, or Hungarian. Detect that language, then write the SAME message in all three languages: English (en), Serbian (sr), Hungarian (hu).

Baker's instruction: "${instruction}"

The next order window opens on: ${formatDate(nextCycleStartDate)}

Style to match (this is the bakery's standard, non-holiday closed-ordering message, shown to customers when no holiday message is set — match its warm, friendly, brief tone and its use of the reopening date):
"${STANDARD_MESSAGE_PATTERN}"

Write a warm, friendly holiday version instead: mention the reason for closing (from the instruction), state that new orders open again on the date above, and use 1-3 emoji that fit the specific holiday's spirit (not necessarily 💛). Keep each message to 1-3 short sentences, no markdown formatting, no placeholders.

Respond with ONLY a raw JSON object, no code fences, no commentary, in exactly this shape:
{"en": "...", "sr": "...", "hu": "..."}`;

  const { text } = await generateText({ model: google(MODEL), prompt });

  const parsed = extractJson(text);
  const result: Partial<GenerateHolidayMessageResult> =
    parsed && typeof parsed === "object" ? (parsed as Partial<GenerateHolidayMessageResult>) : {};

  if (
    typeof result.en !== "string" ||
    typeof result.sr !== "string" ||
    typeof result.hu !== "string" ||
    !result.en.trim() ||
    !result.sr.trim() ||
    !result.hu.trim()
  ) {
    throw new HolidayMessageGenerationError("AI response was missing one or more languages");
  }

  return { en: result.en.trim(), sr: result.sr.trim(), hu: result.hu.trim() };
}
