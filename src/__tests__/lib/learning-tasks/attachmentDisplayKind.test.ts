import { describe, expect, it } from "vitest";
import {
  classifyAttachmentDisplayKind,
  groupItemsByAttachmentDisplayKind,
} from "@/lib/learning-tasks/attachmentDisplayKind";

describe("classifyAttachmentDisplayKind", () => {
  it("classifies embeds", () => {
    expect(classifyAttachmentDisplayKind({ kind: "embed", mimeType: null })).toBe("embed");
  });

  it("classifies PDF by mime or extension", () => {
    expect(classifyAttachmentDisplayKind({ kind: "file", mimeType: "application/pdf" })).toBe("pdf");
    expect(classifyAttachmentDisplayKind({ kind: "file", mimeType: "", label: "Handout.PDF" })).toBe("pdf");
  });

  it("classifies Word, Excel, and Office by mime or extension", () => {
    expect(
      classifyAttachmentDisplayKind({
        kind: "file",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    ).toBe("word");
    expect(classifyAttachmentDisplayKind({ kind: "file", mimeType: "", filename: "sheet.xlsx" })).toBe("spreadsheet");
    expect(
      classifyAttachmentDisplayKind({
        kind: "file",
        mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      }),
    ).toBe("presentation");
  });

  it("classifies media", () => {
    expect(classifyAttachmentDisplayKind({ kind: "file", mimeType: "image/png" })).toBe("image");
    expect(classifyAttachmentDisplayKind({ kind: "file", mimeType: "audio/mpeg" })).toBe("audio");
    expect(classifyAttachmentDisplayKind({ kind: "file", mimeType: "video/mp4" })).toBe("video");
  });
});

describe("groupItemsByAttachmentDisplayKind", () => {
  it("returns non-empty groups in section order", () => {
    const items = [
      { id: "a", k: "audio" as const },
      { id: "p", k: "pdf" as const },
    ];
    const groups = groupItemsByAttachmentDisplayKind(items, (i) => i.k);
    expect(groups.map((g) => g.kind)).toEqual(["pdf", "audio"]);
    expect(groups[0].items).toHaveLength(1);
  });
});
