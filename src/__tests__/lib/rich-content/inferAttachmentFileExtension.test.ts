import { describe, expect, it } from "vitest";
import { inferAttachmentFileExtension } from "@/lib/rich-content/inferAttachmentFileExtension";

describe("inferAttachmentFileExtension", () => {
  it("reads extension from label first", () => {
    expect(
      inferAttachmentFileExtension(
        "https://cdn.example/storage/event-media/abc/file",
        "Programa.pdf",
      ),
    ).toBe("pdf");
  });

  it("falls back to URL path when label has no extension", () => {
    expect(
      inferAttachmentFileExtension(
        "https://project.supabase.co/storage/v1/object/public/event-media/events/x/doc.docx",
        "Material del evento",
      ),
    ).toBe("docx");
  });

  it("finds extension anywhere in a signed storage URL", () => {
    expect(
      inferAttachmentFileExtension(
        "https://project.supabase.co/storage/v1/object/sign/event-media/events/x/uuid.pdf?token=abc",
        "Material",
      ),
    ).toBe("pdf");
  });
});
