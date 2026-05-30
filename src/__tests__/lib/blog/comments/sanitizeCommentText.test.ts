import { describe, expect, it } from "vitest";
import { sanitizeCommentText } from "@/lib/blog/comments/sanitizeCommentText";

describe("sanitizeCommentText", () => {
  it("strips html tags", () => {
    expect(sanitizeCommentText('<b>Hello</b> <a href="#">world</a>')).toBe("Hello world");
  });

  it("collapses whitespace", () => {
    expect(sanitizeCommentText("  hello \n\n   world  ")).toBe("hello world");
  });
});
