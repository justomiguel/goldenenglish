import { describe, expect, it } from "vitest";
import { parseOpenAiKey } from "@/lib/ai/providers/openai/parseOpenAiKey";

describe("parseOpenAiKey", () => {
  it("rejects an empty value", () => {
    expect(parseOpenAiKey("   ")).toEqual({ ok: false, errorCode: "openai_key_empty" });
  });

  it("rejects a value that does not start with sk-", () => {
    expect(parseOpenAiKey("pk-not-a-secret-key-value")).toEqual({
      ok: false,
      errorCode: "openai_key_invalid",
    });
  });

  it("accepts a project key fixture", () => {
    expect(parseOpenAiKey("  sk-proj-test-key-value  ")).toEqual({
      ok: true,
      apiKey: "sk-proj-test-key-value",
      last4: "alue",
    });
  });
});
