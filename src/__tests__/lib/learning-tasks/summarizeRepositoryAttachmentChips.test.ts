import { describe, expect, it } from "vitest";
import { summarizeRepositoryAttachmentChips } from "@/lib/learning-tasks/summarizeRepositoryAttachmentChips";

describe("summarizeRepositoryAttachmentChips", () => {
  it("merges Word/Excel/PPT into office and counts audios", () => {
    const assets = [
      { kind: "file" as const, mimeType: "audio/mpeg", label: "a" },
      { kind: "file" as const, mimeType: "audio/mpeg", label: "b" },
      { kind: "file" as const, mimeType: "audio/mpeg", label: "c" },
      { kind: "file" as const, mimeType: "audio/mpeg", label: "d" },
      { kind: "file" as const, mimeType: "audio/mpeg", label: "e" },
      { kind: "file" as const, mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "w.docx" },
      { kind: "file" as const, mimeType: "application/pdf", label: "x.pdf" },
    ];
    const chips = summarizeRepositoryAttachmentChips(assets);
    expect(chips).toContainEqual({ chip: "audio", count: 5 });
    expect(chips).toContainEqual({ chip: "office", count: 1 });
    expect(chips).toContainEqual({ chip: "pdf", count: 1 });
  });

  it("counts embeds", () => {
    const chips = summarizeRepositoryAttachmentChips([{ kind: "embed", mimeType: null, label: "YouTube" }]);
    expect(chips).toEqual([{ chip: "embed", count: 1 }]);
  });
});
