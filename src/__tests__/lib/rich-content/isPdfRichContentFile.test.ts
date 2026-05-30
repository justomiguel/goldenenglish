import { describe, expect, it } from "vitest";
import { isPdfRichContentFile } from "@/lib/rich-content/isPdfRichContentFile";

describe("isPdfRichContentFile", () => {
  it("returns true when extension is in the href", () => {
    expect(
      isPdfRichContentFile(
        "https://example.supabase.co/storage/v1/object/public/event-media/foo/report.pdf?token=abc",
        "Annual report",
      ),
    ).toBe(true);
  });

  it("returns true when extension is only in the label", () => {
    expect(isPdfRichContentFile("https://example.com/signed/123", "program.pdf")).toBe(true);
  });

  it("returns false for non-pdf files", () => {
    expect(isPdfRichContentFile("https://example.com/file.docx", "Notes.docx")).toBe(false);
  });
});
