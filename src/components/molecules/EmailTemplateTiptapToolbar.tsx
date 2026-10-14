"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Table2,
  Underline as UnderlineIcon,
  Undo2,
  Video,
} from "lucide-react";
import { EmailTemplateTiptapBarBtn } from "@/components/molecules/EmailTemplateTiptapBarBtn";
import type { EmailTemplateTiptapLabels } from "./EmailTemplateBodyField";

export interface EmailTemplateTiptapToolbarProps {
  editor: Editor;
  disabled: boolean;
  tiptap: EmailTemplateTiptapLabels;
  toolbarId: string;
  onLink: () => void;
  onImage: () => void;
  onVideo: () => void;
}

export function EmailTemplateTiptapToolbar({
  editor,
  disabled,
  tiptap,
  toolbarId,
  onLink,
  onImage,
  onVideo,
}: EmailTemplateTiptapToolbarProps) {
  return (
    <div
      id={toolbarId}
      className="flex flex-wrap items-center gap-0.5 rounded-t-[var(--layout-border-radius)] border border-b-0 border-[var(--color-border)] bg-[var(--color-muted)] p-1"
      role="toolbar"
      aria-label={tiptap.toolbarGroupLabel}
    >
      <EmailTemplateTiptapBarBtn
        pressed={Boolean(editor.isActive("bold"))}
        disabled={disabled || !editor.can().chain().focus().toggleBold().run()}
        label={tiptap.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" aria-hidden />
      </EmailTemplateTiptapBarBtn>
      <EmailTemplateTiptapBarBtn
        pressed={Boolean(editor.isActive("italic"))}
        disabled={disabled || !editor.can().chain().focus().toggleItalic().run()}
        label={tiptap.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" aria-hidden />
      </EmailTemplateTiptapBarBtn>
      <EmailTemplateTiptapBarBtn
        pressed={Boolean(editor.isActive("underline"))}
        disabled={disabled}
        label={tiptap.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="h-4 w-4" aria-hidden />
      </EmailTemplateTiptapBarBtn>
      <EmailTemplateTiptapBarBtn
        pressed={Boolean(editor.isActive("strike"))}
        disabled={disabled}
        label={tiptap.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" aria-hidden />
      </EmailTemplateTiptapBarBtn>
      <span className="mx-0.5 h-5 w-px self-center bg-[var(--color-border)]" aria-hidden />
      <EmailTemplateTiptapBarBtn
        pressed={Boolean(editor.isActive("heading", { level: 2 }))}
        disabled={disabled}
        label={tiptap.heading2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" aria-hidden />
      </EmailTemplateTiptapBarBtn>
      <EmailTemplateTiptapBarBtn
        pressed={Boolean(editor.isActive("paragraph") && !editor.isActive("heading"))}
        disabled={disabled}
        label={tiptap.paragraph}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        <Pilcrow className="h-4 w-4" aria-hidden />
      </EmailTemplateTiptapBarBtn>
      <span className="mx-0.5 h-5 w-px self-center bg-[var(--color-border)]" aria-hidden />
      <EmailTemplateTiptapBarBtn
        pressed={Boolean(editor.isActive("bulletList"))}
        disabled={disabled}
        label={tiptap.bulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" aria-hidden />
      </EmailTemplateTiptapBarBtn>
      <EmailTemplateTiptapBarBtn
        pressed={Boolean(editor.isActive("orderedList"))}
        disabled={disabled}
        label={tiptap.orderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" aria-hidden />
      </EmailTemplateTiptapBarBtn>
      <EmailTemplateTiptapBarBtn
        pressed={Boolean(editor.isActive("blockquote"))}
        disabled={disabled}
        label={tiptap.blockquote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" aria-hidden />
      </EmailTemplateTiptapBarBtn>
      <EmailTemplateTiptapBarBtn
        pressed={false}
        disabled={disabled}
        label={tiptap.horizontalRule}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="h-4 w-4" aria-hidden />
      </EmailTemplateTiptapBarBtn>
      <span className="mx-0.5 h-5 w-px self-center bg-[var(--color-border)]" aria-hidden />
      <EmailTemplateTiptapBarBtn pressed={Boolean(editor.isActive("link"))} disabled={disabled} label={tiptap.link} onClick={onLink}>
        <LinkIcon className="h-4 w-4" aria-hidden />
      </EmailTemplateTiptapBarBtn>
      <EmailTemplateTiptapBarBtn pressed={false} disabled={disabled} label={tiptap.image} onClick={onImage}>
        <ImageIcon className="h-4 w-4" aria-hidden />
      </EmailTemplateTiptapBarBtn>
      <EmailTemplateTiptapBarBtn pressed={false} disabled={disabled} label={tiptap.video} onClick={onVideo}>
        <Video className="h-4 w-4" aria-hidden />
      </EmailTemplateTiptapBarBtn>
      <EmailTemplateTiptapBarBtn
        pressed={false}
        disabled={disabled}
        label={tiptap.insertTable}
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <Table2 className="h-4 w-4" aria-hidden />
      </EmailTemplateTiptapBarBtn>
      <span className="mx-0.5 h-5 w-px self-center bg-[var(--color-border)]" aria-hidden />
      <EmailTemplateTiptapBarBtn
        pressed={false}
        disabled={disabled || !editor.can().undo()}
        label={tiptap.undo}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="h-4 w-4" aria-hidden />
      </EmailTemplateTiptapBarBtn>
      <EmailTemplateTiptapBarBtn
        pressed={false}
        disabled={disabled || !editor.can().redo()}
        label={tiptap.redo}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="h-4 w-4" aria-hidden />
      </EmailTemplateTiptapBarBtn>
    </div>
  );
}
