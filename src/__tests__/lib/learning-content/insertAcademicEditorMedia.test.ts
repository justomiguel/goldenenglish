import { describe, expect, it, vi } from "vitest";
import {
  insertUploadedMediaInEditor,
  insertYoutubeInEditor,
} from "@/lib/learning-content/insertAcademicEditorMedia";

function mockEditor() {
  const chain = {
    focus: vi.fn().mockReturnThis(),
    setImage: vi.fn().mockReturnThis(),
    insertContent: vi.fn().mockReturnThis(),
    run: vi.fn(),
  };
  const commands = {
    setYoutubeVideo: vi.fn(),
  };
  return { chain: () => chain, commands, _chain: chain };
}

describe("insertUploadedMediaInEditor", () => {
  it("inserts image at caret via setImage", () => {
    const editor = mockEditor();
    const html = insertUploadedMediaInEditor(editor as never, {
      url: "https://cdn.example/a.jpg",
      label: "Photo",
      contentType: "image/jpeg",
    });

    expect(editor._chain.setImage).toHaveBeenCalledWith({
      src: "https://cdn.example/a.jpg",
      alt: "Photo",
    });
    expect(html).toContain("https://cdn.example/a.jpg");
  });

  it("inserts non-image media as HTML content", () => {
    const editor = mockEditor();
    insertUploadedMediaInEditor(editor as never, {
      url: "https://cdn.example/doc.pdf",
      label: "Doc",
      contentType: "application/pdf",
    });

    expect(editor._chain.insertContent).toHaveBeenCalled();
    expect(editor._chain.setImage).not.toHaveBeenCalled();
  });
});

describe("insertYoutubeInEditor", () => {
  it("embeds youtube at caret and returns html snippet", () => {
    const editor = mockEditor();
    const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const html = insertYoutubeInEditor(editor as never, url);

    expect(html).toContain("iframe");
    expect(editor.commands.setYoutubeVideo).toHaveBeenCalledWith({
      src: url,
      width: 720,
      height: 405,
    });
  });

  it("returns null for invalid youtube url", () => {
    const editor = mockEditor();
    expect(insertYoutubeInEditor(editor as never, "not-a-url")).toBeNull();
  });
});
