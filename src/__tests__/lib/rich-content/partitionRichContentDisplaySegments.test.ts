import { describe, expect, it } from "vitest";
import { parseRichEditorHtmlForDisplay } from "@/lib/rich-content/parseRichEditorHtmlForDisplay";
import { partitionRichContentDisplaySegments } from "@/lib/rich-content/partitionRichContentDisplaySegments";

describe("partitionRichContentDisplaySegments", () => {
  it("keeps prose and embeds in body; moves PDF, audio and video to attachments", () => {
    const html = [
      "<p>Intro</p>",
      '<p><a href="https://cdn.example/doc.pdf" target="_blank" rel="noopener noreferrer">Programa.pdf</a></p>',
      '<div data-youtube-video=""><iframe src="https://www.youtube-nocookie.com/embed/abc" width="720" height="405" allowfullscreen="true"></iframe></div>',
      '<p><audio controls preload="metadata" src="https://cdn.example/a.mp3"></audio></p>',
    ].join("");

    const { body, attachments } = partitionRichContentDisplaySegments(
      parseRichEditorHtmlForDisplay(html),
    );

    expect(body.map((s) => s.kind)).toEqual(["html", "embed"]);
    expect(attachments.map((s) => s.kind)).toEqual(["file", "audio"]);
  });

  it("keeps image file links in body order", () => {
    const html =
      '<p>Texto</p><p><a href="https://cdn.example/photo.png" target="_blank" rel="noopener noreferrer">Foto.png</a></p>';

    const { body, attachments } = partitionRichContentDisplaySegments(
      parseRichEditorHtmlForDisplay(html),
    );

    expect(body.map((s) => s.kind)).toEqual(["html", "file"]);
    expect(attachments).toEqual([]);
  });
});
