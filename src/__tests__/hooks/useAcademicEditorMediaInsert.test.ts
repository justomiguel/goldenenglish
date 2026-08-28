import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAcademicEditorMediaInsert } from "@/hooks/useAcademicEditorMediaInsert";

const insertUploadedMediaInEditor = vi.fn();
const insertYoutubeInEditor = vi.fn();
const getTopLevelBlockIndex = vi.fn(() => 0);
const buildUploadedMediaInsertHtml = vi.fn(() => "<p>media</p>");
const buildBlogYoutubeInsertHtml = vi.fn(() => "<p>yt</p>");

vi.mock("@/lib/learning-content/insertAcademicEditorMedia", () => ({
  insertUploadedMediaInEditor: (...args: unknown[]) => insertUploadedMediaInEditor(...args),
  insertYoutubeInEditor: (...args: unknown[]) => insertYoutubeInEditor(...args),
  getTopLevelBlockIndex: (...args: unknown[]) => getTopLevelBlockIndex(...args),
  buildUploadedMediaInsertHtml: (...args: unknown[]) => buildUploadedMediaInsertHtml(...args),
}));

vi.mock("@/lib/blog/buildBlogMediaInsertHtml", () => ({
  buildBlogYoutubeInsertHtml: (...args: unknown[]) => buildBlogYoutubeInsertHtml(...args),
}));

describe("useAcademicEditorMediaInsert", () => {
  it("uploads a multi-file attach batch in one call when onMediaFilesUpload is set", async () => {
    const files = [
      new File([new Uint8Array(4)], "a.jpg", { type: "image/jpeg" }),
      new File([new Uint8Array(4)], "b.mp4", { type: "video/mp4" }),
    ];
    const onMediaFilesUpload = vi.fn(async (batch: File[]) =>
      batch.map((file) => ({
        src: `https://cdn.example/${file.name}`,
        label: file.name,
        contentType: file.type,
      })),
    );
    const { result } = renderHook(() =>
      useAcademicEditorMediaInsert({
        editor: { isDestroyed: false } as never,
        onImageUpload: async () => null,
        mediaAttach: {
          labels: {
            title: "t",
            lead: "l",
            chooseYoutube: "y",
            chooseFile: "f",
            cancel: "c",
            clipTooltip: "clip",
          },
          onMediaFileUpload: async () => null,
          onMediaFilesUpload,
        },
      }),
    );

    const originalCreate = document.createElement.bind(document);
    const input = originalCreate("input");
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "input") return input;
      return originalCreate(tag);
    });
    Object.defineProperty(input, "files", { configurable: true, get: () => files });
    vi.spyOn(input, "click").mockImplementation(() => {
      void input.onchange?.(new Event("change"));
    });

    await act(async () => {
      await result.current.addMediaFile();
    });

    expect(onMediaFilesUpload).toHaveBeenCalledTimes(1);
    expect(onMediaFilesUpload).toHaveBeenCalledWith(files);
    expect(insertUploadedMediaInEditor).toHaveBeenCalledTimes(2);
  });
});
