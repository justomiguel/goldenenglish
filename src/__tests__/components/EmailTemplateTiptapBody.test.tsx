import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { inserted, chain } = vi.hoisted(() => {
  const inserted: string[] = [];
  const chain: Record<string, unknown> = { run: () => true };
  const loop = () => chain;
  for (const method of [
    "focus",
    "toggleBold",
    "toggleItalic",
    "extendMarkRange",
    "unsetLink",
    "setLink",
    "toggleHeading",
    "setParagraph",
    "toggleBulletList",
    "toggleOrderedList",
    "toggleBlockquote",
    "setHorizontalRule",
    "insertTable",
    "undo",
    "redo",
  ]) {
    chain[method] = loop;
  }
  chain.insertContent = (html: string) => {
    inserted.push(html);
    return chain;
  };
  return { inserted, chain };
});

const { uploadEmailTemplateImage } = vi.hoisted(() => ({
  uploadEmailTemplateImage: vi.fn(async () => '<img src="https://cdn.example/a.png" alt="Foto" />'),
}));

vi.mock("@/lib/client/uploadEmailTemplateImage", () => ({
  uploadEmailTemplateImage: (...args: unknown[]) => uploadEmailTemplateImage(...args),
}));

vi.mock("@tiptap/react", () => ({
  useEditor: () => ({
    isActive: () => false,
    chain: () => chain,
    can: () => ({ undo: () => true, redo: () => true, chain: () => chain }),
    commands: { setContent: () => undefined },
    getHTML: () => "<p></p>",
    getAttributes: () => ({}),
    setEditable: () => undefined,
  }),
  EditorContent: () => <div />,
}));

import { EmailTemplateTiptapBody } from "@/components/molecules/EmailTemplateTiptapBody";
import { dictEn } from "@/test/dictEn";

const tiptap = dictEn.admin.communications.templates.bodyField.tiptap;

describe("EmailTemplateTiptapBody media", () => {
  it("inserts a video link and rejects a page that is not a video", () => {
    inserted.length = 0;
    render(<EmailTemplateTiptapBody value="<p></p>" onChange={() => {}} tiptap={tiptap} />);

    fireEvent.click(screen.getByRole("button", { name: tiptap.video }));
    fireEvent.change(screen.getByLabelText(tiptap.videoUrlFieldLabel), {
      target: { value: "https://youtu.be/dQw4w9WgXcQ" },
    });
    fireEvent.click(screen.getByRole("button", { name: tiptap.videoModalApply }));

    expect(inserted[0]).toContain("https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(inserted[0]).not.toContain("iframe");
    expect(screen.getByRole("button", { name: tiptap.image })).toBeInTheDocument();
    expect(screen.getByText(tiptap.imageLimit)).toHaveTextContent("10 MB");

    fireEvent.click(screen.getByRole("button", { name: tiptap.video }));
    fireEvent.change(screen.getByLabelText(tiptap.videoUrlFieldLabel), {
      target: { value: "https://example.com/clip" },
    });
    fireEvent.click(screen.getByRole("button", { name: tiptap.videoModalApply }));
    expect(screen.getByRole("alert")).toHaveTextContent(tiptap.videoError);
    expect(inserted).toHaveLength(1);
  });

  it("inserts the uploaded image and shows an error when the file is rejected", async () => {
    inserted.length = 0;
    const realCreate = document.createElement.bind(document);
    const input = realCreate("input");
    vi.spyOn(document, "createElement").mockImplementation(((tag: string) =>
      tag === "input" ? input : realCreate(tag)) as typeof document.createElement);
    render(<EmailTemplateTiptapBody value="<p></p>" onChange={() => {}} tiptap={tiptap} />);

    fireEvent.click(screen.getByRole("button", { name: tiptap.image }));
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [new File(["x"], "a.png", { type: "image/png" })],
    });
    input.onchange?.(new Event("change"));
    await waitFor(() => expect(inserted.at(-1)).toContain("https://cdn.example/a.png"));

    uploadEmailTemplateImage.mockResolvedValueOnce(null);
    fireEvent.click(screen.getByRole("button", { name: tiptap.image }));
    input.onchange?.(new Event("change"));
    expect(await screen.findByRole("alert")).toHaveTextContent(tiptap.imageError);
    vi.restoreAllMocks();
  });

  it("shows the upload loader until the image is inserted", async () => {
    inserted.length = 0;
    let resolveUpload: (html: string | null) => void = () => undefined;
    uploadEmailTemplateImage.mockImplementationOnce(async (input: unknown) => {
      const progress = input as {
        onProgress?: (phase: "preparing" | "sending", value?: number) => void;
      };
      progress.onProgress?.("sending", 40);
      return new Promise<string | null>((resolve) => {
        resolveUpload = resolve;
      });
    });
    const realCreate = document.createElement.bind(document);
    const input = realCreate("input");
    vi.spyOn(document, "createElement").mockImplementation(((tag: string) =>
      tag === "input" ? input : realCreate(tag)) as typeof document.createElement);
    render(<EmailTemplateTiptapBody value="<p></p>" onChange={() => {}} tiptap={tiptap} />);

    fireEvent.click(screen.getByRole("button", { name: tiptap.image }));
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [new File(["x"], "foto.png", { type: "image/png" })],
    });
    input.onchange?.(new Event("change"));

    expect((await screen.findAllByText(tiptap.uploadProgressSending)).length).toBeGreaterThan(0);
    expect(screen.getAllByText("40%").length).toBeGreaterThan(0);
    expect(screen.getByText("foto.png")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: tiptap.image })).toBeDisabled();

    resolveUpload('<img src="https://cdn.example/a.png" alt="Foto" />');
    await waitFor(() => expect(inserted.at(-1)).toContain("https://cdn.example/a.png"));
    await waitFor(() => expect(screen.queryByText("40%")).not.toBeInTheDocument());
    vi.restoreAllMocks();
  });
});
