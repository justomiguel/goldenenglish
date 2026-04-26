import { describe, expect, it } from "vitest";
import { extensionForLearningTaskMime, validateLearningTaskFile } from "@/lib/learning-tasks/assets";

describe("learning task asset validation", () => {
  it("accepts common Microsoft Office files", () => {
    const docx = validateLearningTaskFile({
      name: "lesson-plan.docx",
      size: 1024,
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    expect(docx).toEqual({
      ok: true,
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    expect(extensionForLearningTaskMime("application/vnd.openxmlformats-officedocument.presentationml.presentation")).toBe("pptx");
  });
});
