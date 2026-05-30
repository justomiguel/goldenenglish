import { describe, expect, it } from "vitest";
import {
  isRichContentFileAttachmentLink,
  stripRichAnchorLabel,
} from "@/lib/rich-content/isRichContentFileAttachmentLink";

describe("isRichContentFileAttachmentLink", () => {
  it("accepts Supabase event-media URLs even without a file extension in the path", () => {
    const href =
      "https://project.supabase.co/storage/v1/object/public/event-media/events/e1/abc-123";
    expect(isRichContentFileAttachmentLink(href, "", "Programa")).toBe(true);
  });

  it("accepts links when only the label carries the extension", () => {
    const href = "https://cdn.example/download?id=1";
    expect(
      isRichContentFileAttachmentLink(
        href,
        'target="_blank"',
        "Material complementario.pdf",
      ),
    ).toBe(true);
  });

  it("accepts TipTap links with formatted anchor text", () => {
    const href = "https://cdn.example/doc.pdf";
    expect(
      isRichContentFileAttachmentLink(
        href,
        'href="https://cdn.example/doc.pdf" target="_blank" rel="noopener noreferrer"',
        "<strong>Guía.pdf</strong>",
      ),
    ).toBe(true);
  });

  it("rejects regular inline prose links", () => {
    expect(
      isRichContentFileAttachmentLink(
        "https://example.com/about",
        "",
        "About us",
      ),
    ).toBe(false);
  });
});

describe("stripRichAnchorLabel", () => {
  it("strips nested markup from anchor labels", () => {
    expect(stripRichAnchorLabel("<strong>Archivo.pdf</strong>")).toBe("Archivo.pdf");
  });
});
