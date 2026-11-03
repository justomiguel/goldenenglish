import { describe, expect, it } from "vitest";
import { parsePlainText } from "@/lib/learning-tasks/plainText";

describe("parsePlainText", () => {
  it("rejects an empty answer and a note past the limit", () => {
    expect(parsePlainText("  ", 4000)).toEqual({ ok: false, code: "empty" });
    expect(parsePlainText("a".repeat(501), 500)).toEqual({ ok: false, code: "too_long" });
    expect(parsePlainText(" Ready ", 500)).toEqual({ ok: true, text: "Ready" });
  });
});
