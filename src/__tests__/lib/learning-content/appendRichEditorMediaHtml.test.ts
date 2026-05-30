import { describe, expect, it } from "vitest";
import { appendRichEditorMediaHtml } from "@/lib/learning-content/appendRichEditorMediaHtml";

describe("appendRichEditorMediaHtml", () => {
  const snippet = '<p><a href="https://cdn.example.com/a.pdf">Guía</a></p>';

  it("returns snippet alone when body is empty", () => {
    expect(appendRichEditorMediaHtml("", snippet)).toBe(snippet);
    expect(appendRichEditorMediaHtml("<p></p>", snippet)).toBe(snippet);
  });

  it("appends snippet to existing HTML", () => {
    expect(appendRichEditorMediaHtml("<p>Intro</p>", snippet)).toBe("<p>Intro</p>" + snippet);
  });
});
