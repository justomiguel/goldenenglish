import { describe, expect, it } from "vitest";
import { buildLessonMaterials, withSignedLessonFiles } from "@/lib/courses/lessonMaterials";

describe("buildLessonMaterials", () => {
  it("returns nothing when the lesson is locked", () => {
    expect(
      buildLessonMaterials({
        locked: true,
        bodyHtml: "<p>Secret</p>",
        blocks: [{ id: "b1", kind: "text", sortOrder: 0, payload: { bodyHtml: "<p>Secret</p>" } }],
      }),
    ).toEqual([]);
  });

  it("keeps safe html, a video, and drops a javascript link", () => {
    const items = buildLessonMaterials({
      locked: false,
      blocks: [
        { id: "text", kind: "text", sortOrder: 1, payload: { bodyHtml: "<p>Hello</p><script>x</script>" } },
        {
          id: "video",
          kind: "video_embed",
          sortOrder: 0,
          payload: { embedUrl: "https://www.youtube.com/watch?v=abc123", label: "Clip" },
        },
        { id: "bad", kind: "external_link", sortOrder: 2, payload: { href: "javascript:alert(1)", label: "Bad" } },
        { id: "quiz", kind: "quiz", sortOrder: 3, payload: { prompt: "Answer on paper" } },
      ],
    });
    expect(items.map((item) => item.kind)).toEqual(["video", "html", "quiz"]);
    expect(items[1]).toMatchObject({ kind: "html", html: "<p>Hello</p>" });
  });

  it("signs a file and drops it when the signer returns null", async () => {
    const items = buildLessonMaterials({
      locked: false,
      blocks: [
        {
          id: "file",
          kind: "pdf",
          sortOrder: 0,
          payload: { label: "Sheet" },
          storagePath: "templates/a.pdf",
          mimeType: "application/pdf",
        },
      ],
    });
    const hidden = await withSignedLessonFiles(items, async () => null);
    expect(hidden).toEqual([]);
    const shown = await withSignedLessonFiles(items, async () => "https://files.example/a.pdf");
    expect(shown).toEqual([
      {
        id: "file",
        kind: "file",
        label: "Sheet",
        href: "https://files.example/a.pdf",
        mimeType: "application/pdf",
      },
    ]);
  });
});
