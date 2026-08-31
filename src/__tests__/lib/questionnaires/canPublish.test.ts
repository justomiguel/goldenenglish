import { describe, expect, it } from "vitest";
import { canPublishQuestionnaire } from "@/lib/questionnaires/canPublish";

describe("canPublishQuestionnaire", () => {
  it("rejects zero active questions", () => {
    expect(canPublishQuestionnaire([])).toEqual({ ok: false, code: "no_questions" });
    expect(
      canPublishQuestionnaire([{ questionType: "text", options: [], archived: true }]),
    ).toEqual({ ok: false, code: "no_questions" });
  });

  it("rejects choice questions with fewer than two options", () => {
    expect(
      canPublishQuestionnaire([
        { questionType: "single_choice", options: ["Sí"], archived: false },
      ]),
    ).toEqual({ ok: false, code: "choice_options" });
  });

  it("accepts a valid mix", () => {
    expect(
      canPublishQuestionnaire([
        { questionType: "text", options: [], archived: false },
        { questionType: "yes_no", options: [], archived: false },
        { questionType: "multi_choice", options: ["A", "B"], archived: false },
      ]),
    ).toEqual({ ok: true });
  });
});
