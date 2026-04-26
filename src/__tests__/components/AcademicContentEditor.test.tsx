import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AcademicContentEditor } from "@/components/admin/AcademicContentEditor";
import { dictEn } from "@/test/dictEn";

function buildChain() {
  const chain: Record<string, unknown> = {
    run: vi.fn(() => true),
  };
  const loop = () => chain;
  const methods = [
    "focus",
    "toggleBold",
    "toggleItalic",
    "toggleUnderline",
    "toggleHighlight",
    "toggleHeading",
    "setParagraph",
    "setTextAlign",
    "toggleBulletList",
    "toggleOrderedList",
    "toggleBlockquote",
    "extendMarkRange",
    "unsetLink",
    "setLink",
    "setImage",
    "insertTable",
    "undo",
    "redo",
  ] as const;
  for (const m of methods) {
    chain[m] = loop;
  }
  return chain;
}

const mockEditor = {
  isActive: vi.fn(() => false),
  chain: () => buildChain(),
  can: () => ({ undo: () => true, redo: () => true }),
  commands: {
    setContent: vi.fn(),
    setYoutubeVideo: vi.fn(),
  },
  getHTML: () => "<p></p>",
  getAttributes: vi.fn(() => ({})),
  setEditable: vi.fn(),
};

vi.mock("@tiptap/react", () => ({
  useEditor: () => mockEditor,
  EditorContent: () => <div data-testid="editor-content" />,
}));

describe("AcademicContentEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes dictionary tooltips on toolbar controls", () => {
    const labels = dictEn.dashboard.adminContents;
    render(
      <AcademicContentEditor
        value="<p></p>"
        onChange={() => {}}
        onImageUpload={async () => null}
        labels={labels}
      />,
    );

    const bold = screen.getByRole("button", { name: labels.editorBoldTooltip });
    expect(bold).toHaveAttribute("title", labels.editorBoldTooltip);

    const link = screen.getByRole("button", { name: labels.editorLinkTooltip });
    expect(link).toHaveAttribute("title", labels.editorLinkTooltip);
    expect(labels.editorLinkTooltip.length).toBeGreaterThan(labels.editorLink.length);

    const youtube = screen.getByRole("button", { name: labels.editorYoutubeTooltip });
    expect(youtube).toHaveAttribute("title", labels.editorYoutubeTooltip);
  });
});
