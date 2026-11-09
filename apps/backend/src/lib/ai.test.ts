import { afterEach, describe, expect, it, vi } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import {
  generateHolidayMessages,
  HolidayMessageGenerationError,
} from "./ai.js";

const REOPENING = new Date("2027-01-09T00:00:00.000Z");
const INSTRUCTION = "closed for Christmas, back after the holidays";

/** A mock model that replies with `text`, as a provider returning JSON output would. */
function modelReplying(text: string) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text }],
      finishReason: { unified: "stop", raw: "stop" },
      usage: {
        inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
        outputTokens: { total: 20, text: 20, reasoning: 0 },
      },
      warnings: [],
    }),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("generateHolidayMessages with a model injected", () => {
  it("returns the three messages, trimmed", async () => {
    const model = modelReplying(
      JSON.stringify({
        en: "  Merry Christmas! 🎄 Orders open 9 January 2027.  ",
        sr: "Srećan Božić! 🎄",
        hu: "\nBoldog karácsonyt! 🎄\n",
      }),
    );

    await expect(
      generateHolidayMessages(INSTRUCTION, REOPENING, { model }),
    ).resolves.toEqual({
      en: "Merry Christmas! 🎄 Orders open 9 January 2027.",
      sr: "Srećan Božić! 🎄",
      hu: "Boldog karácsonyt! 🎄",
    });
  });

  it("sends the instruction and the formatted reopening date", async () => {
    const model = modelReplying(
      JSON.stringify({ en: "Hi", sr: "Zdravo", hu: "Szia" }),
    );

    await generateHolidayMessages(INSTRUCTION, REOPENING, { model });

    const prompt = JSON.stringify(model.doGenerateCalls[0].prompt);
    expect(prompt).toContain(INSTRUCTION);
    expect(prompt).toContain("09 January 2027");
  });

  it.each([
    ["an empty language", { en: "Hi", sr: "", hu: "Szia" }],
    ["a blank language", { en: "Hi", sr: "   ", hu: "Szia" }],
    ["a missing language", { en: "Hi", sr: "Zdravo" }],
  ])("throws HolidayMessageGenerationError for %s", async (_, reply) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const model = modelReplying(JSON.stringify(reply));

    await expect(
      generateHolidayMessages(INSTRUCTION, REOPENING, { model }),
    ).rejects.toBeInstanceOf(HolidayMessageGenerationError);
  });

  it("passes a model error on as HolidayMessageGenerationError", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const model = new MockLanguageModelV4({
      doGenerate: async () => {
        throw new Error("provider is down");
      },
    });

    await expect(
      generateHolidayMessages(INSTRUCTION, REOPENING, { model }),
    ).rejects.toBeInstanceOf(HolidayMessageGenerationError);
  });
});

describe("generateHolidayMessages configured from the environment", () => {
  it.each([
    ["AI_HOLIDAY_MESSAGE_MODEL is missing", undefined, "sk-test"],
    ["OPENAI_API_KEY is missing", "openai:gpt-5-mini-2025-08-07", undefined],
    ["the model has no provider prefix", "gpt-5-mini-2025-08-07", "sk-test"],
    ["the model names no model", "openai:", "sk-test"],
    ["the provider isn't openai", "google:gemini-2.5-flash", "sk-test"],
  ])("throws HolidayMessageGenerationError when %s", async (_, setting, key) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("AI_HOLIDAY_MESSAGE_MODEL", setting);
    vi.stubEnv("OPENAI_API_KEY", key);
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    const error = await generateHolidayMessages(INSTRUCTION, REOPENING).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(HolidayMessageGenerationError);
    // Rejected by the config check, not by a generation attempt that failed.
    expect((error as Error).message).not.toMatch(/AI generation failed/);
    expect(fetch).not.toHaveBeenCalled();
  });
});
