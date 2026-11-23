import { describe, expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import { openAiKeyFormError } from "@/lib/ai/providers/openai/openAiKeyFormError";

// REGRESSION CHECK: A known OpenAI code keeps its own sentence. An unknown code stays visible.

describe("openAiKeyFormError", () => {
  const errors = en.pulsar.admin.openai.errors;

  it("shows the sentence for a known code and the raw code when the sentence is missing", () => {
    const rejected = openAiKeyFormError("openai_key_rejected", errors);
    const limited = openAiKeyFormError("openai_rate_limited", errors);
    expect(rejected).toContain("openai_key_rejected");
    expect(rejected).not.toBe(limited);
    expect(rejected.toLowerCase()).not.toContain("try again");
    expect(openAiKeyFormError("ai_key_rejected", errors)).toContain("ai_key_rejected");
    expect(openAiKeyFormError("ai_key_rejected", errors)).not.toBe(openAiKeyFormError("ai_rate_limited", errors));
    expect(openAiKeyFormError("418", errors)).toBe("418");
  });
});
