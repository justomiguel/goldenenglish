import { describe, expect, it } from "vitest";
import { parseRichEditorHtmlForDisplay } from "@/lib/rich-content/parseRichEditorHtmlForDisplay";

describe("parseRichEditorHtmlForDisplay", () => {
  it("keeps prose and extracts file, audio, video and youtube blocks in order", () => {
    const html = [
      "<p>Intro</p>",
      '<p><a href="https://cdn.example/doc.pdf" target="_blank" rel="noopener noreferrer">Programa.pdf</a></p>',
      "<p>Más texto</p>",
      '<p><audio controls preload="metadata" src="https://cdn.example/a.mp3"></audio></p>',
      '<div data-youtube-video=""><iframe src="https://www.youtube-nocookie.com/embed/abc" width="720" height="405" allowfullscreen="true"></iframe></div>',
    ].join("");

    const segments = parseRichEditorHtmlForDisplay(html);

    expect(segments).toEqual([
      { kind: "html", html: "<p>Intro</p>" },
      { kind: "file", href: "https://cdn.example/doc.pdf", label: "Programa.pdf" },
      { kind: "html", html: "<p>Más texto</p>" },
      { kind: "audio", src: "https://cdn.example/a.mp3" },
      { kind: "embed", src: "https://www.youtube-nocookie.com/embed/abc" },
    ]);
  });

  it("extracts file links when rel precedes target (sanitize-html order)", () => {
    const html =
      '<p><a href="https://cdn.example/files/guide.pdf" rel="noopener noreferrer" target="_blank">Guía.pdf</a></p>';

    expect(parseRichEditorHtmlForDisplay(html)).toEqual([
      { kind: "file", href: "https://cdn.example/files/guide.pdf", label: "Guía.pdf" },
    ]);
  });

  it("extracts file links by extension when target is missing", () => {
    const html = '<p><a href="https://cdn.example/storage/report.docx">Informe</a></p>';

    expect(parseRichEditorHtmlForDisplay(html)).toEqual([
      { kind: "file", href: "https://cdn.example/storage/report.docx", label: "Informe" },
    ]);
  });

  it("extracts event-media links without relying on target=_blank", () => {
    const html =
      '<p><a href="https://project.supabase.co/storage/v1/object/public/event-media/events/e1/uuid">Material del evento</a></p>';

    expect(parseRichEditorHtmlForDisplay(html)).toEqual([
      {
        kind: "file",
        href: "https://project.supabase.co/storage/v1/object/public/event-media/events/e1/uuid",
        label: "Material del evento",
      },
    ]);
  });

  it("extracts file links when the filename is wrapped in inline marks", () => {
    const html =
      '<p><a href="https://cdn.example/a.pdf" target="_blank" rel="noopener noreferrer"><strong>Programa.pdf</strong></a></p>';

    expect(parseRichEditorHtmlForDisplay(html)).toEqual([
      { kind: "file", href: "https://cdn.example/a.pdf", label: "Programa.pdf" },
    ]);
  });

  it("extracts two consecutive file attachments as separate cards", () => {
    const html = [
      '<p><a href="https://cdn.example/a.pdf" target="_blank" rel="noopener noreferrer">Programa.pdf</a></p>',
      '<p><a href="https://cdn.example/b.pdf" target="_blank" rel="noopener noreferrer">Guía.pdf</a></p>',
    ].join("");

    expect(parseRichEditorHtmlForDisplay(html)).toEqual([
      { kind: "file", href: "https://cdn.example/a.pdf", label: "Programa.pdf" },
      { kind: "file", href: "https://cdn.example/b.pdf", label: "Guía.pdf" },
    ]);
  });

  it("extracts file links in paragraphs with TipTap trailing breaks", () => {
    const html = [
      '<p><a href="https://cdn.example/a.pdf" target="_blank" rel="noopener noreferrer">Programa.pdf</a><br></p>',
      '<p><a href="https://cdn.example/b.pdf" target="_blank" rel="noopener noreferrer">Guía.pdf</a><br class="ProseMirror-trailingBreak"></p>',
    ].join("");

    expect(parseRichEditorHtmlForDisplay(html)).toEqual([
      { kind: "file", href: "https://cdn.example/a.pdf", label: "Programa.pdf" },
      { kind: "file", href: "https://cdn.example/b.pdf", label: "Guía.pdf" },
    ]);
  });

  it("returns prose-only html unchanged as a single segment", () => {
    expect(parseRichEditorHtmlForDisplay("<p>Solo texto</p>")).toEqual([
      { kind: "html", html: "<p>Solo texto</p>" },
    ]);
  });
});
