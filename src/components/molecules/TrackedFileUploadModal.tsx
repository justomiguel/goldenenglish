"use client";

import { BlockingFileUploadModal } from "@/components/molecules/BlockingFileUploadModal";
import type { TrackedFileUploadSnapshot } from "@/lib/client/trackedFileUploadProgress";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";

interface TrackedFileUploadModalProps {
  snapshot: TrackedFileUploadSnapshot | null;
  labels: FileUploadProgressLabels;
}

export function TrackedFileUploadModal({ snapshot, labels }: TrackedFileUploadModalProps) {
  if (!snapshot) return null;
  const fileIndex =
    snapshot.total > 1
      ? labels.fileIndex
          .replaceAll("{current}", String(snapshot.current))
          .replaceAll("{total}", String(snapshot.total))
      : null;
  const uploading = snapshot.phase === "uploading";

  return (
    <BlockingFileUploadModal
      open
      title={labels.modalTitle}
      filename={snapshot.filename}
      fileIndex={fileIndex}
      phaseLabel={uploading ? labels.progressSending : labels.progressReading}
      percent={snapshot.percent}
      indeterminate={snapshot.percent === null}
      runningAriaLabel={labels.loadingAria}
    />
  );
}
