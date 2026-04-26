import { describe, expect, it } from "vitest";
import { collapseRichTextDisplayHtml } from "@/lib/learning-tasks/collapseRichTextDisplayHtml";

describe("collapseRichTextDisplayHtml", () => {
  it("strips trailing empty paragraphs and br-only paragraphs", () => {
    const html =
      '<p>Hello</p><p><br class="ProseMirror-trailingBreak"></p><p><br></p><p></p>';
    expect(collapseRichTextDisplayHtml(html)).toBe("<p>Hello</p>");
  });

  it("strips leading empty paragraphs", () => {
    const html = '<p></p><p><br></p><p>Body</p>';
    expect(collapseRichTextDisplayHtml(html)).toBe("<p>Body</p>");
  });

  it("leaves intentional middle spacing (non-empty blocks between content)", () => {
    const html = "<p>A</p><p></p><p>B</p>";
    expect(collapseRichTextDisplayHtml(html)).toBe(html);
  });

  it("handles nbsp-only paragraphs as empty at edges", () => {
    const html = "<p>&nbsp;</p><p>Hi</p><p>&#160;</p>";
    expect(collapseRichTextDisplayHtml(html)).toBe("<p>Hi</p>");
  });
});
