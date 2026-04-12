import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RichTextEditor } from "@/components/molecules/RichTextEditor";

const setContent = vi.fn();
const setEditable = vi.fn();
const getHTML = vi.fn(() => "<p></p>");

vi.mock("@tiptap/react", () => ({
  useEditor: () => ({
    getHTML,
    setEditable,
    commands: { setContent },
    on: vi.fn(),
    off: vi.fn(),
    chain: vi.fn(),
  }),
  EditorContent: () => <div data-testid="editor-content" />,
}));

vi.mock("@tiptap/starter-kit", () => ({ default: {} }));

describe("RichTextEditor", () => {
  it("renders editor surface when useEditor returns editor", () => {
    const onChange = vi.fn();
    render(<RichTextEditor value="<p></p>" onChange={onChange} aria-label="Body" />);
    expect(screen.getByTestId("editor-content")).toBeInTheDocument();
  });
});
