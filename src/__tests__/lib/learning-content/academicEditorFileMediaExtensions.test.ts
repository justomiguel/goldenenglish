import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it, vi } from "vitest";
import {
  AcademicFileAudio,
  AcademicFileVideo,
} from "@/components/admin/academicEditorFileMediaExtensions";

const VIDEO_HTML =
  '<p><video controls preload="metadata" src="https://cdn.example.com/clip.mp4"></video></p>';
const AUDIO_HTML =
  '<p><audio controls preload="metadata" src="https://cdn.example.com/track.mp3"></audio></p>';

function roundTrip(extensions: Parameters<typeof Editor>[0]["extensions"], html: string) {
  const editor = new Editor({ extensions, content: html });
  const out = editor.getHTML();
  editor.destroy();
  return out;
}

describe("academicEditorFileMediaExtensions", () => {
  it("StarterKit alone drops uploaded video tags", () => {
    const html = roundTrip([StarterKit], VIDEO_HTML);
    expect(html).not.toContain("clip.mp4");
  });

  it("keeps video src after setContent when AcademicFileVideo is registered", () => {
    const html = roundTrip([StarterKit, AcademicFileVideo], VIDEO_HTML);
    expect(html).toContain("clip.mp4");
    expect(html).toContain("<video");
  });

  it("keeps audio src after setContent when AcademicFileAudio is registered", () => {
    const html = roundTrip([StarterKit, AcademicFileAudio], AUDIO_HTML);
    expect(html).toContain("track.mp3");
    expect(html).toContain("<audio");
  });

  it("keeps video after insertContent of uploaded snippet", () => {
    const editor = new Editor({
      extensions: [StarterKit, AcademicFileVideo],
      content: "<p></p>",
    });
    editor.commands.insertContent(VIDEO_HTML);
    expect(editor.getHTML()).toContain("clip.mp4");
    editor.destroy();
  });

  it("node view delete button removes the media node", () => {
    const deleteRange = vi.fn();
    const render = AcademicFileVideo.config.addNodeView?.();
    const view = render?.({
      node: { attrs: { src: "https://cdn.example.com/clip.mp4" }, nodeSize: 1 },
      getPos: () => 3,
      editor: { commands: { deleteRange } },
    } as never);
    const button = view?.dom.querySelector("button");
    expect(button).toBeTruthy();
    button?.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    expect(deleteRange).toHaveBeenCalledWith({ from: 3, to: 4 });
  });

  it("node view stopEvent accepts a raw DOM event", () => {
    const render = AcademicFileVideo.config.addNodeView?.();
    const view = render?.({
      node: { attrs: { src: "https://cdn.example.com/clip.mp4" }, nodeSize: 1 },
      getPos: () => 0,
      editor: { commands: { deleteRange: vi.fn() } },
    } as never);
    expect(() => view?.stopEvent?.(new MouseEvent("mousedown") as never)).not.toThrow();
  });

  it("node view ignores media mutations so a loading video does not freeze the editor", () => {
    const render = AcademicFileVideo.config.addNodeView?.();
    expect(render).toEqual(expect.any(Function));
    const view = render?.({
      node: { attrs: { src: "https://cdn.example.com/clip.mp4" }, nodeSize: 1 },
      getPos: () => 0,
      editor: { commands: { deleteRange: vi.fn() } },
    } as never);
    expect(view?.ignoreMutation?.({} as never)).toBe(true);
  });

  it("is a top-level block so text can sit above and below", () => {
    const editor = new Editor({
      extensions: [StarterKit, AcademicFileVideo],
      content: "<p></p>",
    });
    editor.commands.insertContent({
      type: "academicFileVideo",
      attrs: { src: "https://cdn.example.com/clip.mp4" },
    });
    expect(editor.getJSON().content?.some((node) => node.type === "academicFileVideo")).toBe(
      true,
    );

    editor.commands.insertContentAt(0, {
      type: "paragraph",
      content: [{ type: "text", text: "arriba" }],
    });
    editor.commands.insertContentAt(editor.state.doc.content.size, {
      type: "paragraph",
      content: [{ type: "text", text: "abajo" }],
    });

    const html = editor.getHTML();
    expect(html.indexOf("arriba")).toBeLessThan(html.indexOf("clip.mp4"));
    expect(html.indexOf("clip.mp4")).toBeLessThan(html.indexOf("abajo"));
    editor.destroy();
  });
});
