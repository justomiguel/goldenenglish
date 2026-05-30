"use client";

import { useState } from "react";
import { ExternalLink, FileSearch } from "lucide-react";
import { AttachmentFileTypeBadge } from "@/components/molecules/AttachmentFileTypeBadge";
import { PdfViewerModal } from "@/components/molecules/PdfViewerModal";
import { formatAttachmentTypeBadgeLabel } from "@/lib/rich-content/formatAttachmentTypeBadgeLabel";
import { inferAttachmentFileExtension } from "@/lib/rich-content/inferAttachmentFileExtension";
import { isPdfRichContentFile } from "@/lib/rich-content/isPdfRichContentFile";
import { classifyAttachmentDisplayKind } from "@/lib/learning-tasks/attachmentDisplayKind";
import type { RichContentDisplayLabels } from "@/lib/rich-content/richContentDisplayTypes";

interface RichContentFileAttachmentProps {
  href: string;
  label: string;
  labels: RichContentDisplayLabels;
}

export function RichContentFileAttachment({ href, label, labels }: RichContentFileAttachmentProps) {
  const extension = inferAttachmentFileExtension(href, label);
  const kind = classifyAttachmentDisplayKind({
    kind: "file",
    filename: extension ? `attachment.${extension}` : label,
    label,
    extension,
  });
  const badgeLabel = formatAttachmentTypeBadgeLabel(kind, extension);
  const typeLabel =
    kind === "embed" ? labels.attachmentTypes.other : labels.attachmentTypes[kind];
  const isPdf = isPdfRichContentFile(href, label);
  const [viewerOpen, setViewerOpen] = useState(false);

  const cardClassName =
    "group flex min-h-[44px] w-full items-center gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition-colors hover:bg-[var(--color-muted)]/40";

  if (isPdf) {
    return (
      <>
        <button
          type="button"
          className={cardClassName}
          title={labels.pdfViewer.viewPdf}
          aria-label={`${labels.pdfViewer.viewPdf}: ${label}`}
          onClick={() => setViewerOpen(true)}
        >
          <AttachmentFileTypeBadge kind={kind} badgeLabel={badgeLabel} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-[var(--color-primary)] underline-offset-2 group-hover:underline">
              {label}
            </span>
            <span className="mt-0.5 block text-xs font-medium text-[var(--color-muted-foreground)]">
              {typeLabel}
            </span>
          </span>
          <FileSearch className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
        </button>
        <PdfViewerModal
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          title={label}
          fileUrl={href}
          labels={labels.pdfViewer}
        />
      </>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={labels.downloadFile}
      aria-label={`${labels.downloadFile}: ${label}`}
      className={cardClassName}
    >
      <AttachmentFileTypeBadge kind={kind} badgeLabel={badgeLabel} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[var(--color-primary)] underline-offset-2 group-hover:underline">
          {label}
        </span>
        <span className="mt-0.5 block text-xs font-medium text-[var(--color-muted-foreground)]">
          {typeLabel}
        </span>
      </span>
      <ExternalLink className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
    </a>
  );
}
