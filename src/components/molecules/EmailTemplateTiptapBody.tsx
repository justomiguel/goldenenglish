"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";
import { PromptStringModal } from "@/components/molecules/PromptStringModal";
import { uploadEmailTemplateImage } from "@/lib/client/uploadEmailTemplateImage";
import { emailVideoLinkHtml } from "@/lib/email/emailMediaHtml";
import type { EmailTemplateTiptapLabels } from "./EmailTemplateBodyField";
import { EmailTemplateTiptapToolbar } from "./EmailTemplateTiptapToolbar";

export interface EmailTemplateTiptapBodyProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  tiptap: EmailTemplateTiptapLabels;
}

const visualPlaceholder = (html: string) => (html?.trim() ? html : "<p></p>");

export function EmailTemplateTiptapBody({ value, onChange, disabled, tiptap }: EmailTemplateTiptapBodyProps) {
  const isDisabled = Boolean(disabled);
  const toolbarId = useId();
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkInitial, setLinkInitial] = useState("https://");
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<"preparing" | "sending" | null>(null);
  const [uploadValue, setUploadValue] = useState<number | undefined>(undefined);
  const [mediaError, setMediaError] = useState<"image" | "video" | null>(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, linkOnPaste: true },
      }),
      Image.configure({ allowBase64: false }),
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
    const prev = editor.getAttributes("link").href as string | undefined;
    setLinkInitial(prev ?? "https://");
    setLinkModalOpen(true);
  }, [editor]);

  const onImage = useCallback(() => {
    if (!editor || isDisabled) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      setMediaError(null);
      void uploadEmailTemplateImage({
        file,
        onProgress: (phase, next) => {
          setUploadPhase(phase);
          setUploadValue(next);
        },
      }).then((html) => {
        setUploadPhase(null);
        setUploadValue(undefined);
        if (!html) {
          setMediaError("image");
          return;
        }
        editor.chain().focus().insertContent(html).run();
      });
    };
    input.click();
  }, [editor, isDisabled]);

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
      <EmailTemplateTiptapToolbar
        editor={editor}
        disabled={isDisabled || uploadPhase !== null}
        tiptap={tiptap}
        toolbarId={toolbarId}
        onLink={onLink}
        onImage={onImage}
        onVideo={() => setVideoModalOpen(true)}
      />
      {uploadPhase ? (
        <InlineUploadProgressBar
          label={uploadPhase === "preparing" ? tiptap.uploadProgressPreparing : tiptap.uploadProgressSending}
          indeterminate={uploadPhase === "preparing"}
          value={uploadValue}
        />
      ) : null}
      {mediaError ? (
        <p role="alert" className="px-1 py-1 text-sm text-[var(--color-error)]">
          {mediaError === "image" ? tiptap.imageError : tiptap.videoError}
        </p>
      ) : null}
      <EditorContent editor={editor} />
      <PromptStringModal
        open={linkModalOpen}
        onOpenChange={setLinkModalOpen}
        title={tiptap.linkModalTitle}
        description={tiptap.linkPrompt}
        fieldLabel={tiptap.linkUrlFieldLabel}
        initialValue={linkInitial}
        cancelLabel={tiptap.linkModalCancel}
        confirmLabel={tiptap.linkModalApply}
        onConfirm={(next) => {
          const typed = next.trim();
          if (typed === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
          }
          editor.chain().focus().extendMarkRange("link").setLink({ href: typed }).run();
        }}
      />
      <PromptStringModal
        open={videoModalOpen}
        onOpenChange={setVideoModalOpen}
        title={tiptap.videoModalTitle}
        description={tiptap.videoPrompt}
        fieldLabel={tiptap.videoUrlFieldLabel}
        initialValue="https://"
        cancelLabel={tiptap.videoModalCancel}
        confirmLabel={tiptap.videoModalApply}
        onConfirm={(next) => {
          const html = emailVideoLinkHtml(next, { label: tiptap.videoLinkLabel });
          if (!html) {
            setMediaError("video");
            return;
          }
          setMediaError(null);
          editor.chain().focus().insertContent(html).run();
        }}
      />
    </div>
  );
}
