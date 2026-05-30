import { describe, expect, it } from "vitest";
import {
  blogAttachmentsToDraftMaterials,
  draftMaterialsToBlogAttachments,
} from "@/lib/blog/mapDraftMaterials";

describe("mapDraftMaterials", () => {
  it("round-trips file and embed attachments", () => {
    const materials = blogAttachmentsToDraftMaterials([
      {
        kind: "file",
        label: "Audio clip",
        storagePath: "articles/abc/file.mp3",
        contentType: "audio/mpeg",
        sortOrder: 0,
      },
      {
        kind: "embed",
        label: "Demo video",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        sortOrder: 1,
      },
    ]);

    const attachments = draftMaterialsToBlogAttachments(materials);
    expect(attachments).toHaveLength(2);
    expect(attachments[0]).toMatchObject({
      kind: "file",
      label: "Audio clip",
      storagePath: "articles/abc/file.mp3",
      sortOrder: 0,
    });
    expect(attachments[1]).toMatchObject({
      kind: "embed",
      label: "Demo video",
      sortOrder: 1,
    });
  });

  it("defaults missing optional fields when mapping drafts back", () => {
    const attachments = draftMaterialsToBlogAttachments([
      {
        id: "1",
        kind: "embed",
        label: "Form",
        url: undefined,
      },
      {
        id: "2",
        kind: "file",
        label: "Doc",
        storagePath: undefined,
      },
    ]);

    expect(attachments[0]).toMatchObject({ kind: "embed", url: "" });
    expect(attachments[1]).toMatchObject({ kind: "file", storagePath: "" });
  });
});
