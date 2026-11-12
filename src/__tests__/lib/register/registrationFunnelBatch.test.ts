import { describe, expect, it } from "vitest";
import { registrationFunnelBatchMessage, summarizeRegistrationFunnelBatch } from "@/lib/register/registrationFunnelBatch";

const sentences = {
  funnel_batch_empty: "No selected lead is still in this stage. Refresh the list. Code: funnel_batch_empty",
  funnel_batch_partial:
    "{{updated}} leads moved and {{failed}} did not. Review the list and mark the rest again. Code: funnel_batch_partial",
  save_failed: "The change was not saved. Try again. Code: save_failed",
};

describe("summarizeRegistrationFunnelBatch", () => {
  it("returns funnel_batch_empty when no id is still in the stage", () => {
    expect(summarizeRegistrationFunnelBatch([])).toEqual({
      ok: false,
      code: "funnel_batch_empty",
      updated: 0,
      failed: 0,
    });
    expect(
      summarizeRegistrationFunnelBatch([
        { applied: false, leftStage: true },
        { applied: false, leftStage: true },
      ]),
    ).toMatchObject({ ok: false, code: "funnel_batch_empty", updated: 0 });
  });

  it("counts a mixed run as funnel_batch_partial", () => {
    expect(
      summarizeRegistrationFunnelBatch([
        { applied: true, leftStage: false },
        { applied: false, leftStage: false },
      ]),
    ).toEqual({ ok: false, code: "funnel_batch_partial", updated: 1, failed: 1 });
  });

  it("returns save_failed when every lead still in the stage fails", () => {
    expect(
      summarizeRegistrationFunnelBatch([{ applied: false, leftStage: false }]),
    ).toEqual({ ok: false, code: "save_failed", updated: 0, failed: 1 });
  });
});

describe("registrationFunnelBatchMessage", () => {
  it("keeps an unknown code in the sentence", () => {
    const message = registrationFunnelBatchMessage(
      { code: "mystery_code", updated: 0, failed: 0 },
      sentences,
      "Send this code with the claim. Code: {{code}}",
    );
    expect(message).toContain("mystery_code");
    expect(message).not.toBe(sentences.save_failed);
  });

  it("fills both counts for a partial batch", () => {
    const message = registrationFunnelBatchMessage(
      { code: "funnel_batch_partial", updated: 2, failed: 1 },
      sentences,
      "Send this code with the claim. Code: {{code}}",
    );
    expect(message).toContain("2");
    expect(message).toContain("1");
    expect(message).toContain("funnel_batch_partial");
  });
});
