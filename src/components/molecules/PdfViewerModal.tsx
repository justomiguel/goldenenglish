"use client";

import { Modal } from "@/components/atoms/Modal";
import { PdfDocumentViewer } from "@/components/molecules/PdfDocumentViewer";
import type { RichContentPdfViewerLabels } from "@/lib/rich-content/richContentDisplayTypes";

interface PdfViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fileUrl: string;
  labels: RichContentPdfViewerLabels;
}

export function PdfViewerModal({
  open,
  onOpenChange,
  title,
  fileUrl,
  labels,
}: PdfViewerModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId="pdf-viewer-title"
      title={title}
      dialogClassName="sm:max-w-4xl lg:max-w-5xl"
      stackClassName="z-[120]"
    >
      {open ? (
        <PdfDocumentViewer fileUrl={fileUrl} documentTitle={title} labels={labels} />
      ) : null}
    </Modal>
  );
}
