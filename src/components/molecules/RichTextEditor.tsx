"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Native tooltip on the editor surface (dictionary-backed when shown to users). */
  title?: string;
  "aria-label"?: string;
}

export function RichTextEditor({
  value,
  onChange,
  disabled,
  placeholder,
  title,
  "aria-label": ariaLabel,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value?.trim() ? value : "<p></p>",
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[120px] rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
        "data-placeholder": placeholder ?? "",
        ...(title ? { title } : {}),
        ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
      },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    const cur = editor.getHTML();
    const next = value?.trim() ? value : "<p></p>";
    if (next !== cur) editor.commands.setContent(next, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) {
    return (
      <div
        className="min-h-[120px] rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]"
        aria-hidden
      />
    );
  }

  return <EditorContent editor={editor} />;
}
