import { describe, expect, it } from "vitest";
import { formatAttachmentTypeBadgeLabel } from "@/lib/rich-content/formatAttachmentTypeBadgeLabel";

describe("formatAttachmentTypeBadgeLabel", () => {
  it("uses uppercase extension for pdf", () => {
    expect(formatAttachmentTypeBadgeLabel("pdf", "pdf")).toBe("PDF");
  });

  it("maps office extensions to short badges", () => {
    expect(formatAttachmentTypeBadgeLabel("word", "docx")).toBe("DOC");
    expect(formatAttachmentTypeBadgeLabel("spreadsheet", "xlsx")).toBe("XLS");
  });

  it("falls back to kind when extension is missing", () => {
    expect(formatAttachmentTypeBadgeLabel("pdf", null)).toBe("PDF");
    expect(formatAttachmentTypeBadgeLabel("other", null)).toBe("FILE");
  });
});
