"use client";

import type { ReactNode } from "react";
import type { Editor } from "@tiptap/core";
import {
  AlignCenter,
  AlignLeft,
  Bold,
  Heading2,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Table2,
  Underline as UnderlineIcon,
  Undo2,
  Video as YoutubeIcon,
} from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["dashboard"]["adminContents"];

export function AcademicContentEditorToolbar({
  editor,
  toolbarId,
  isDisabled,
  labels,
  setUrlDialog,
  addImage,
}: {
  editor: Editor;
  toolbarId: string;
  isDisabled: boolean;
  labels: Labels;
  setUrlDialog: (next: null | { kind: "link" | "youtube"; initial: string }) => void;
  addImage: () => void;
}) {
  return (
    <div
      id={toolbarId}
      role="toolbar"
      aria-label={labels.editorToolbar}
      className="flex flex-wrap gap-1 rounded-t-[var(--layout-border-radius)] border border-b-0 border-[var(--color-border)] bg-[var(--color-muted)] p-2"
    >
      <Tool pressed={editor.isActive("bold")} disabled={isDisabled} tooltip={labels.editorBoldTooltip} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4 shrink-0" aria-hidden={true} /></Tool>
      <Tool pressed={editor.isActive("italic")} disabled={isDisabled} tooltip={labels.editorItalicTooltip} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4 shrink-0" aria-hidden={true} /></Tool>
      <Tool pressed={editor.isActive("underline")} disabled={isDisabled} tooltip={labels.editorUnderlineTooltip} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4 shrink-0" aria-hidden={true} /></Tool>
      <Tool pressed={editor.isActive("highlight")} disabled={isDisabled} tooltip={labels.editorHighlightTooltip} onClick={() => editor.chain().focus().toggleHighlight().run()}><Highlighter className="h-4 w-4 shrink-0" aria-hidden={true} /></Tool>
      <Sep />
      <Tool pressed={editor.isActive("heading", { level: 2 })} disabled={isDisabled} tooltip={labels.editorHeadingTooltip} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4 shrink-0" aria-hidden={true} /></Tool>
      <Tool pressed={editor.isActive("paragraph")} disabled={isDisabled} tooltip={labels.editorParagraphTooltip} onClick={() => editor.chain().focus().setParagraph().run()}><Pilcrow className="h-4 w-4 shrink-0" aria-hidden={true} /></Tool>
      <Tool pressed={editor.isActive({ textAlign: "left" })} disabled={isDisabled} tooltip={labels.editorAlignLeftTooltip} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="h-4 w-4 shrink-0" aria-hidden={true} /></Tool>
      <Tool pressed={editor.isActive({ textAlign: "center" })} disabled={isDisabled} tooltip={labels.editorAlignCenterTooltip} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="h-4 w-4 shrink-0" aria-hidden={true} /></Tool>
      <Sep />
      <Tool pressed={editor.isActive("bulletList")} disabled={isDisabled} tooltip={labels.editorBulletListTooltip} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4 shrink-0" aria-hidden={true} /></Tool>
      <Tool pressed={editor.isActive("orderedList")} disabled={isDisabled} tooltip={labels.editorOrderedListTooltip} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4 shrink-0" aria-hidden={true} /></Tool>
      <Tool pressed={editor.isActive("blockquote")} disabled={isDisabled} tooltip={labels.editorQuoteTooltip} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4 shrink-0" aria-hidden={true} /></Tool>
      <Sep />
      <Tool
        pressed={editor.isActive("link")}
        disabled={isDisabled}
        tooltip={labels.editorLinkTooltip}
        onClick={() => {
          const prev = editor.getAttributes("link").href as string | undefined;
          setUrlDialog({ kind: "link", initial: prev ?? "https://" });
        }}
      >
        <LinkIcon className="h-4 w-4 shrink-0" aria-hidden={true} />
      </Tool>
      <Tool
        pressed={false}
        disabled={isDisabled}
        tooltip={labels.editorYoutubeTooltip}
        onClick={() =>
          setUrlDialog({
            kind: "youtube",
            initial: "https://www.youtube.com/watch?v=",
          })
        }
      >
        <YoutubeIcon className="h-4 w-4 shrink-0" aria-hidden={true} />
      </Tool>
      <Tool pressed={false} disabled={isDisabled} tooltip={labels.editorImageTooltip} onClick={() => void addImage()}><ImageIcon className="h-4 w-4 shrink-0" aria-hidden={true} /></Tool>
      <Tool pressed={false} disabled={isDisabled} tooltip={labels.editorTableTooltip} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 className="h-4 w-4 shrink-0" aria-hidden={true} /></Tool>
      <Sep />
      <Tool pressed={false} disabled={isDisabled || !editor.can().undo()} tooltip={labels.editorUndoTooltip} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-4 w-4 shrink-0" aria-hidden={true} /></Tool>
      <Tool pressed={false} disabled={isDisabled || !editor.can().redo()} tooltip={labels.editorRedoTooltip} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-4 w-4 shrink-0" aria-hidden={true} /></Tool>
    </div>
  );
}

function Sep() {
  return <span className="mx-1 h-6 w-px self-center bg-[var(--color-border)]" aria-hidden />;
}

function Tool({ children, pressed, disabled, tooltip, onClick }: {
  children: ReactNode;
  pressed: boolean;
  disabled: boolean;
  tooltip: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled}
      aria-pressed={pressed}
      aria-label={tooltip}
      title={tooltip}
      className={`!px-2 !py-1.5 ${pressed ? "bg-[var(--color-background)] ring-1 ring-[var(--color-border)]" : ""}`}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
