"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { isValidYoutubeUrl } from "@tiptap/extension-youtube";
import { AcademicYoutube } from "@/components/admin/academicEditorYoutubeExtension";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TableKit } from "@tiptap/extension-table";
import { PromptStringModal } from "@/components/molecules/PromptStringModal";
import { AcademicContentEditorToolbar } from "@/components/admin/AcademicContentEditorToolbar";
import { tiptapAcademicLinkShouldAutoLink } from "@/lib/learning-content/tiptapAcademicLinkShouldAutoLink";
import { logClientException } from "@/lib/logging/clientLog";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["dashboard"]["adminContents"];

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

export function AcademicContentEditor({
  value,
  onChange,
  onImageUpload,
  labels,
  disabled,
}: AcademicContentEditorProps) {
  const toolbarId = useId();
  const isDisabled = Boolean(disabled);
  const [urlDialog, setUrlDialog] = useState<
    null | { kind: "link" | "youtube"; initial: string }
  >(null);
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
          return tiptapAcademicLinkShouldAutoLink(url);
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
      <AcademicContentEditorToolbar
        editor={editor}
        toolbarId={toolbarId}
        isDisabled={isDisabled}
        labels={labels}
        setUrlDialog={setUrlDialog}
        addImage={addImage}
      />
      <EditorContent editor={editor} />

      <PromptStringModal
        open={urlDialog !== null}
        onOpenChange={(o) => {
          if (!o) setUrlDialog(null);
        }}
        title={
          urlDialog?.kind === "youtube"
            ? labels.editorYoutubeModalTitle
            : labels.editorLinkModalTitle
        }
        description={
          urlDialog?.kind === "youtube" ? labels.editorYoutubePrompt : labels.editorLinkPrompt
        }
        fieldLabel={labels.editorUrlFieldLabel}
        initialValue={urlDialog?.initial ?? ""}
        cancelLabel={labels.editorModalCancel}
        confirmLabel={labels.editorModalApply}
        onConfirm={(value) => {
          if (!editor || !urlDialog) return;
          if (urlDialog.kind === "link") {
            const href = value.trim();
            if (!href) {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              return;
            }
            editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
            return;
          }
          const u = value.trim();
          if (!u) return;
          editor.commands.setYoutubeVideo({ src: u, width: 720, height: 405 });
        }}
      />
    </div>
  );
}
