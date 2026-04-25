"use client";

import { useCallback, useEffect, useId, type ReactNode } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table2,
  Underline as UnderlineIcon,
  Undo2,
  Link as LinkIcon,
  Heading2,
  Pilcrow,
} from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { EmailTemplateTiptapLabels } from "./EmailTemplateBodyField";

export interface EmailTemplateTiptapBodyProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  /** Labels for toolbar `aria-label`s (dictionary-backed). */
  tiptap: EmailTemplateTiptapLabels;
}

const visualPlaceholder = (html: string) => (html?.trim() ? html : "<p></p>");

function execLink(editor: Editor, promptLabel: string) {
  const prev = editor.getAttributes("link").href as string | undefined;
  const next = typeof window !== "undefined" ? window.prompt(promptLabel, prev ?? "https://") : null;
  if (next === null) return;
  const t = next.trim();
  if (t === "") {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  editor.chain().focus().extendMarkRange("link").setLink({ href: t }).run();
}

export function EmailTemplateTiptapBody({ value, onChange, disabled, tiptap }: EmailTemplateTiptapBodyProps) {
  const isDisabled = Boolean(disabled);
  const toolbarId = useId();
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, linkOnPaste: true },
      }),
      TableKit,
    ],
    content: visualPlaceholder(value),
    editable: !isDisabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[min(50vh,22rem)] rounded-[var(--layout-border-radius)] border border-t-0 border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]",
        "aria-labelledby": toolbarId,
      },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
  });

  const onLink = useCallback(() => {
    if (!editor) return;
    execLink(editor, tiptap.linkPrompt);
  }, [editor, tiptap.linkPrompt]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!isDisabled);
  }, [editor, isDisabled]);

  useEffect(() => {
    if (!editor) return;
    const next = visualPlaceholder(value);
    if (next !== editor.getHTML()) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return <div className="min-h-[min(50vh,22rem)] rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]" aria-hidden />;
  }

  return (
    <div className="space-y-0" id="email-template-body-wysiwyg">
      <div
        id={toolbarId}
        className="flex flex-wrap items-center gap-0.5 rounded-t-[var(--layout-border-radius)] border border-b-0 border-[var(--color-border)] bg-[var(--color-muted)] p-1"
        role="toolbar"
        aria-label={tiptap.toolbarGroupLabel}
      >
        <BarBtn
          pressed={Boolean(editor.isActive("bold"))}
          disabled={isDisabled || !editor.can().chain().focus().toggleBold().run()}
          label={tiptap.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" aria-hidden />
        </BarBtn>
        <BarBtn
          pressed={Boolean(editor.isActive("italic"))}
          disabled={isDisabled || !editor.can().chain().focus().toggleItalic().run()}
          label={tiptap.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" aria-hidden />
        </BarBtn>
        <BarBtn
          pressed={Boolean(editor.isActive("underline"))}
          disabled={isDisabled}
          label={tiptap.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" aria-hidden />
        </BarBtn>
        <BarBtn
          pressed={Boolean(editor.isActive("strike"))}
          disabled={isDisabled}
          label={tiptap.strike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" aria-hidden />
        </BarBtn>
        <span className="mx-0.5 h-5 w-px self-center bg-[var(--color-border)]" aria-hidden />
        <BarBtn
          pressed={Boolean(editor.isActive("heading", { level: 2 }))}
          disabled={isDisabled}
          label={tiptap.heading2}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" aria-hidden />
        </BarBtn>
        <BarBtn
          pressed={Boolean(editor.isActive("paragraph") && !editor.isActive("heading"))}
          disabled={isDisabled}
          label={tiptap.paragraph}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          <Pilcrow className="h-4 w-4" aria-hidden />
        </BarBtn>
        <span className="mx-0.5 h-5 w-px self-center bg-[var(--color-border)]" aria-hidden />
        <BarBtn
          pressed={Boolean(editor.isActive("bulletList"))}
          disabled={isDisabled}
          label={tiptap.bulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" aria-hidden />
        </BarBtn>
        <BarBtn
          pressed={Boolean(editor.isActive("orderedList"))}
          disabled={isDisabled}
          label={tiptap.orderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" aria-hidden />
        </BarBtn>
        <BarBtn
          pressed={Boolean(editor.isActive("blockquote"))}
          disabled={isDisabled}
          label={tiptap.blockquote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" aria-hidden />
        </BarBtn>
        <BarBtn pressed={false} disabled={isDisabled} label={tiptap.horizontalRule} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-4 w-4" aria-hidden />
        </BarBtn>
        <span className="mx-0.5 h-5 w-px self-center bg-[var(--color-border)]" aria-hidden />
        <BarBtn
          pressed={Boolean(editor.isActive("link"))}
          disabled={isDisabled}
          label={tiptap.link}
          onClick={onLink}
        >
          <LinkIcon className="h-4 w-4" aria-hidden />
        </BarBtn>
        <BarBtn
          pressed={false}
          disabled={isDisabled}
          label={tiptap.insertTable}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <Table2 className="h-4 w-4" aria-hidden />
        </BarBtn>
        <span className="mx-0.5 h-5 w-px self-center bg-[var(--color-border)]" aria-hidden />
        <BarBtn pressed={false} disabled={isDisabled || !editor.can().undo()} label={tiptap.undo} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="h-4 w-4" aria-hidden />
        </BarBtn>
        <BarBtn pressed={false} disabled={isDisabled || !editor.can().redo()} label={tiptap.redo} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="h-4 w-4" aria-hidden />
        </BarBtn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function BarBtn({
  children,
  pressed,
  disabled,
  label,
  onClick,
}: {
  children: ReactNode;
  pressed: boolean;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled}
      aria-pressed={pressed}
      title={label}
      aria-label={label}
      className={`!px-1.5 !py-1 ${pressed ? "bg-[var(--color-surface)] ring-1 ring-[var(--color-border)]" : ""}`}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
