import { describe, expect, it } from "vitest";
import { academicEditorHtmlShouldReplace } from "@/lib/learning-content/academicEditorHtmlShouldReplace";

describe("academicEditorHtmlShouldReplace", () => {
  it("refuses a stale parent body that would drop an uploaded video already in the editor", () => {
    const editorHtml =
      '<p>Hola</p><video controls="true" preload="metadata" src="https://cdn.example/clip.mp4"></video><p></p>';
    expect(academicEditorHtmlShouldReplace(editorHtml, "<p>Hola</p>")).toBe(false);
  });

  it("accepts parent html that adds the video", () => {
    expect(
      academicEditorHtmlShouldReplace(
        "<p>Hola</p>",
        '<p>Hola</p><p><video src="https://cdn.example/clip.mp4"></video></p>',
      ),
    ).toBe(true);
  });

  it("accepts a real text edit without media", () => {
    expect(academicEditorHtmlShouldReplace("<p>Hola</p>", "<p>Chau</p>")).toBe(true);
  });
});
