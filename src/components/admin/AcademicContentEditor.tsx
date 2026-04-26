"use client";

import { useCallback, useEffect, useId, type ReactNode } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { isValidYoutubeUrl } from "@tiptap/extension-youtube";
import { AcademicYoutube } from "@/components/admin/academicEditorYoutubeExtension";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TableKit } from "@tiptap/extension-table";
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
import { logClientException } from "@/lib/logging/clientLog";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["dashboard"]["adminContents"];

/** Mirrors @tiptap/extension-link default `shouldAutoLink`, minus YouTube (embed handled by the YouTube node). */
function defaultTiptapLinkShouldAutoLink(url: string): boolean {
  const hasProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(url);
  const hasMaybeProtocol = /^[a-z][a-z0-9+.-]*:/i.test(url);
  if (hasProtocol || (hasMaybeProtocol && !url.includes("@"))) {
    return true;
  }
  const urlWithoutUserinfo = url.includes("@") ? (url.split("@").pop() ?? url) : url;
  const hostname = urlWithoutUserinfo.split(/[/?#:]/)[0] ?? "";
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return false;
  }
  if (!/\./.test(hostname)) {
    return false;
  }
  return true;
}

interface AcademicContentEditorProps {
  value: string;
  onChange: (html: string) => void;
  onImageUpload: (file: File) => Promise<{ src: string; alt: string } | null>;
  labels: Labels;
  disabled?: boolean;
}

const visualPlaceholder = (html: string | null | undefined) => {
  const s = typeof html === "string" ? html : "";
  return s.trim() ? s : "<p></p>";
};

function addLink(editor: Editor, labels: Labels) {
  const prev = editor.getAttributes("link").href as string | undefined;
  const next = window.prompt(labels.editorLinkPrompt, prev ?? "https://");
  if (next === null) return;
  const href = next.trim();
  if (!href) {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
}

function addYoutube(editor: Editor, labels: Labels) {
  const url = window.prompt(labels.editorYoutubePrompt, "https://www.youtube.com/watch?v=");
  if (!url?.trim()) return;
  editor.commands.setYoutubeVideo({ src: url.trim(), width: 720, height: 405 });
}

export function AcademicContentEditor({
  value,
  onChange,
  onImageUpload,
  labels,
  disabled,
}: AcademicContentEditorProps) {
  const toolbarId = useId();
  const isDisabled = Boolean(disabled);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        shouldAutoLink: (url) => {
          if (typeof url !== "string") return false;
          if (isValidYoutubeUrl(url)) return false;
          return defaultTiptapLinkShouldAutoLink(url);
        },
      }),
      Image.configure({
        allowBase64: false,
        inline: false,
        resize: {
          enabled: true,
          minWidth: 48,
          minHeight: 48,
          alwaysPreserveAspectRatio: true,
        },
      }),
      AcademicYoutube,
      Placeholder.configure({ placeholder: labels.editorPlaceholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight,
      TableKit,
    ],
    content: visualPlaceholder(value),
    editable: !isDisabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "ge-academic-editor min-h-[10rem] rounded-b-[var(--layout-border-radius)] border border-t-0 border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm leading-6 text-[var(--color-foreground)] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)] [&_[data-resize-container]]:max-w-full [&_a]:cursor-pointer [&_a]:text-[var(--color-primary)] [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-from-font [&_a]:visited:text-[var(--color-primary)] [&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-[var(--layout-border-radius)] [&_iframe]:my-3 [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-[var(--layout-border-radius)] [&_table]:my-3 [&_table]:w-full [&_td]:border [&_td]:border-[var(--color-border)] [&_td]:p-2 [&_th]:border [&_th]:border-[var(--color-border)] [&_th]:p-2",
        "aria-labelledby": toolbarId,
      },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
  });

  const addImage = useCallback(async () => {
    if (!editor) return;
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/png,image/jpeg,image/webp";
    input.onchange = async () => {
      const files = input.files ? Array.from(input.files) : [];
      for (const file of files) {
        const uploaded = await onImageUpload(file);
        if (uploaded) {
          editor.chain().focus().setImage({ src: uploaded.src, alt: uploaded.alt }).run();
        }
      }
    };
    input.click();
  }, [editor, onImageUpload]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!isDisabled);
  }, [editor, isDisabled]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const next = visualPlaceholder(value);
    let current = "";
    try {
      current = editor.getHTML();
    } catch {
      return;
    }
    if (next !== current) {
      try {
        editor.commands.setContent(next, { emitUpdate: false });
      } catch (err) {
        logClientException("AcademicContentEditor.setContent", err);
        editor.commands.setContent("<p></p>", { emitUpdate: false });
      }
    }
  }, [editor, value]);

  if (!editor) {
    return <div className="min-h-[10rem] rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]" aria-hidden />;
  }

  return (
    <div className="mx-auto w-full max-w-prose">
      <div
        id={toolbarId}
        role="toolbar"
        aria-label={labels.editorToolbar}
        className="flex flex-wrap gap-1 rounded-t-[var(--layout-border-radius)] border border-b-0 border-[var(--color-border)] bg-[var(--color-muted)] p-2"
      >
        <Tool pressed={editor.isActive("bold")} disabled={isDisabled} tooltip={labels.editorBoldTooltip} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" aria-hidden={true} /></Tool>
        <Tool pressed={editor.isActive("italic")} disabled={isDisabled} tooltip={labels.editorItalicTooltip} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" aria-hidden={true} /></Tool>
        <Tool pressed={editor.isActive("underline")} disabled={isDisabled} tooltip={labels.editorUnderlineTooltip} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" aria-hidden={true} /></Tool>
        <Tool pressed={editor.isActive("highlight")} disabled={isDisabled} tooltip={labels.editorHighlightTooltip} onClick={() => editor.chain().focus().toggleHighlight().run()}><Highlighter className="h-4 w-4" aria-hidden={true} /></Tool>
        <Sep />
        <Tool pressed={editor.isActive("heading", { level: 2 })} disabled={isDisabled} tooltip={labels.editorHeadingTooltip} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" aria-hidden={true} /></Tool>
        <Tool pressed={editor.isActive("paragraph")} disabled={isDisabled} tooltip={labels.editorParagraphTooltip} onClick={() => editor.chain().focus().setParagraph().run()}><Pilcrow className="h-4 w-4" aria-hidden={true} /></Tool>
        <Tool pressed={editor.isActive({ textAlign: "left" })} disabled={isDisabled} tooltip={labels.editorAlignLeftTooltip} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="h-4 w-4" aria-hidden={true} /></Tool>
        <Tool pressed={editor.isActive({ textAlign: "center" })} disabled={isDisabled} tooltip={labels.editorAlignCenterTooltip} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="h-4 w-4" aria-hidden={true} /></Tool>
        <Sep />
        <Tool pressed={editor.isActive("bulletList")} disabled={isDisabled} tooltip={labels.editorBulletListTooltip} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" aria-hidden={true} /></Tool>
        <Tool pressed={editor.isActive("orderedList")} disabled={isDisabled} tooltip={labels.editorOrderedListTooltip} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" aria-hidden={true} /></Tool>
        <Tool pressed={editor.isActive("blockquote")} disabled={isDisabled} tooltip={labels.editorQuoteTooltip} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" aria-hidden={true} /></Tool>
        <Sep />
        <Tool pressed={editor.isActive("link")} disabled={isDisabled} tooltip={labels.editorLinkTooltip} onClick={() => addLink(editor, labels)}><LinkIcon className="h-4 w-4" aria-hidden={true} /></Tool>
        <Tool pressed={false} disabled={isDisabled} tooltip={labels.editorYoutubeTooltip} onClick={() => addYoutube(editor, labels)}><YoutubeIcon className="h-4 w-4" aria-hidden={true} /></Tool>
        <Tool pressed={false} disabled={isDisabled} tooltip={labels.editorImageTooltip} onClick={() => void addImage()}><ImageIcon className="h-4 w-4" aria-hidden={true} /></Tool>
        <Tool pressed={false} disabled={isDisabled} tooltip={labels.editorTableTooltip} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 className="h-4 w-4" aria-hidden={true} /></Tool>
        <Sep />
        <Tool pressed={false} disabled={isDisabled || !editor.can().undo()} tooltip={labels.editorUndoTooltip} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-4 w-4" aria-hidden={true} /></Tool>
        <Tool pressed={false} disabled={isDisabled || !editor.can().redo()} tooltip={labels.editorRedoTooltip} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-4 w-4" aria-hidden={true} /></Tool>
      </div>
      <EditorContent editor={editor} />
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
